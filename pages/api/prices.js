// pages/api/prices.js
const FINNHUB_KEY = process.env.FINNHUB_KEY || "d7ou9apr01qmthudj7fgd7ou9apr01qmthudj7g0";

async function fetchKR(ticker) {
  const code = ticker.split(".")[0];
  const res = await fetch(`https://m.stock.naver.com/api/stock/${code}/basic`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Naver ${res.status}`);
  const d = await res.json();
  const price = parseFloat((d.closePrice || d.currentPrice || "").replace(/,/g, ""));
  if (!price) throw new Error("price parse fail");

  // 등락률: 네이버 API에서 compareToPreviousClosePrice 또는 fluctuationsRatio 사용
  const prevPrice = parseFloat((d.compareToPreviousClosePrice || "").replace(/,/g, ""));
  const changePercent = prevPrice
    ? (prevPrice / price) * 100  // compareToPreviousClosePrice는 변동액이므로
    : parseFloat((d.fluctuationsRatio || "0").replace(/,/g, ""));

  // fluctuationsRatio가 있으면 그걸 우선 사용
  const pctRaw = parseFloat((d.fluctuationsRatio || "0").replace(/[^0-9.\-]/g, ""));
  const sign = (d.compareToPreviousPrice?.code === "2" || d.changeType === "RISE") ? 1
    : (d.compareToPreviousPrice?.code === "5" || d.changeType === "FALL") ? -1 : 0;

  return { price, currency: "KRW", changePercent: pctRaw * sign };
}

async function fetchUS(ticker) {
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
  if (!res.ok) throw new Error(`Finnhub ${res.status}`);
  const d = await res.json();
  if (!d.c || d.c === 0) throw new Error("no price");

  // d.c = 현재가, d.pc = 전일종가
  const changePercent = d.pc && d.pc !== 0 ? ((d.c - d.pc) / d.pc) * 100 : 0;

  return { price: d.c, currency: "USD", changePercent: Math.round(changePercent * 100) / 100 };
}

async function fetchUsdKrw() {
  // 방법1: ExchangeRate-API (무료, CORS없음)
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    if (r.ok) {
      const d = await r.json();
      if (d.rates?.KRW > 100) return Math.round(d.rates.KRW * 100) / 100;
    }
  } catch {}
  // 방법2: Frankfurter API
  try {
    const r = await fetch("https://api.frankfurter.app/latest?from=USD&to=KRW");
    if (r.ok) {
      const d = await r.json();
      if (d.rates?.KRW > 100) return Math.round(d.rates.KRW * 100) / 100;
    }
  } catch {}
  // 방법3: Finnhub
  try {
    const r = await fetch(`https://finnhub.io/api/v1/forex/rates?base=USD&token=${FINNHUB_KEY}`);
    if (r.ok) { const d = await r.json(); if (d.quote?.KRW > 100) return Math.round(d.quote.KRW * 100) / 100; }
  } catch {}
  return 1478;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { tickers, fetchRate } = req.body;
  if (!tickers || !Array.isArray(tickers)) return res.status(400).json({ error: "tickers required" });

  const [rateResult, ...priceResults] = await Promise.allSettled([
    fetchRate ? fetchUsdKrw() : Promise.resolve(1450),
    ...tickers.map(({ ticker, isKR }) => isKR ? fetchKR(ticker) : fetchUS(ticker)),
  ]);

  const usdKrw = rateResult.status === "fulfilled" ? rateResult.value : 1450;
  const prices = tickers.map(({ ticker }, i) => {
    const r = priceResults[i];
    return r.status === "fulfilled"
      ? { ticker, ...r.value, error: null }
      : { ticker, price: null, changePercent: null, currency: ticker.includes(".K") ? "KRW" : "USD", error: r.reason?.message };
  });

  res.status(200).json({ prices, usdKrw });
}
