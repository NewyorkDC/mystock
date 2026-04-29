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
  return { price, currency: "KRW" };
}

async function fetchUS(ticker) {
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
  if (!res.ok) throw new Error(`Finnhub ${res.status}`);
  const d = await res.json();
  if (!d.c || d.c === 0) throw new Error("no price");
  return { price: d.c, currency: "USD" };
}

async function fetchUsdKrw() {
  try {
    const r = await fetch(`https://finnhub.io/api/v1/forex/rates?base=USD&token=${FINNHUB_KEY}`);
    if (r.ok) { const d = await r.json(); if (d.quote?.KRW > 100) return Math.round(d.quote.KRW); }
  } catch {}
  return 1450;
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
      : { ticker, price: null, currency: ticker.includes(".K") ? "KRW" : "USD", error: r.reason?.message };
  });

  res.status(200).json({ prices, usdKrw });
}
