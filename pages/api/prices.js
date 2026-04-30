// pages/api/prices.js
const FINNHUB_KEY = process.env.FINNHUB_KEY || "d7ou9apr01qmthudj7fgd7ou9apr01qmthudj7g0";

async function fetchKR(ticker) {
  const code = ticker.split(".")[0];
  // 방법1: 네이버
  try {
    const res = await fetch(`https://m.stock.naver.com/api/stock/${code}/basic`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (res.ok) {
      const d = await res.json();
      const price = parseFloat((d.closePrice || d.currentPrice || "").replace(/,/g, ""));
      if (price) {
        const pctRaw = parseFloat((d.fluctuationsRatio || "0").replace(/[^0-9.\-]/g, ""));
        const sign = (d.compareToPreviousPrice?.code === "2" || d.changeType === "RISE") ? 1
          : (d.compareToPreviousPrice?.code === "5" || d.changeType === "FALL") ? -1 : 0;
        return { price, currency: "KRW", changePercent: pctRaw * sign };
      }
    }
  } catch {}
  // 방법2: Yahoo Finance 백업
  const res2 = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2d`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!res2.ok) throw new Error(`Yahoo KR ${res2.status}`);
  const d2 = await res2.json();
  const meta = d2?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error("no price");
  const price2 = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose || meta.previousClose;
  const changePercent = prevClose ? ((price2 - prevClose) / prevClose) * 100 : 0;
  return { price: price2, currency: "KRW", changePercent: Math.round(changePercent * 100) / 100 };
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

async function fetchJP(ticker) {
  // Stooq API로 일본주식 시세 조회 (무료, CORS없음)
  const code = ticker.replace(".T", ".jp");
  try {
    const res = await fetch(
      `https://stooq.com/q/l/?s=${code}&f=sd2t2ohlcv&h&e=csv`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split("\n");
      if (lines.length >= 2) {
        const cols = lines[1].split(",");
        const price = parseFloat(cols[4]); // close
        const open = parseFloat(cols[2]);
        if (price && price > 0) {
          const changePercent = open && open !== 0 ? ((price - open) / open) * 100 : 0;
          return { price, currency: "JPY", changePercent: Math.round(changePercent * 100) / 100 };
        }
      }
    }
  } catch {}
  // 백업: Finnhub GLOBAL:에 일본주식
  const code2 = ticker.replace(".T","");
  const res2 = await fetch(`https://finnhub.io/api/v1/quote?symbol=${code2}.T&token=${FINNHUB_KEY}`);
  if (!res2.ok) throw new Error(`Finnhub JP ${res2.status}`);
  const d = await res2.json();
  if (!d.c || d.c === 0) throw new Error("no price");
  const changePercent = d.pc ? ((d.c - d.pc) / d.pc) * 100 : 0;
  return { price: d.c, currency: "JPY", changePercent: Math.round(changePercent * 100) / 100 };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { tickers, fetchRate } = req.body;
  if (!tickers || !Array.isArray(tickers)) return res.status(400).json({ error: "tickers required" });

  // 환율 먼저
  const usdKrw = fetchRate ? await fetchUsdKrw().catch(()=>1450) : 1450;

  // 종목 시세: Finnhub rate limit 방지 위해 50ms 간격으로 순차 처리
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const priceResults = [];
  for (const { ticker, isKR } of tickers) {
    try {
      let result;
      if (isKR) result = await fetchKR(ticker);
      else if (ticker.endsWith(".T")) result = await fetchJP(ticker);
      else result = await fetchUS(ticker);
      priceResults.push({ status: "fulfilled", value: result });
    } catch(e) {
      priceResults.push({ status: "rejected", reason: e });
    }
    await sleep(50);
  }

  const prices = tickers.map(({ ticker }, i) => {
    const r = priceResults[i];
    const currency = ticker.includes(".K") ? "KRW" : ticker.endsWith(".T") ? "JPY" : "USD";
    return r.status === "fulfilled"
      ? { ticker, ...r.value, error: null }
      : { ticker, price: null, changePercent: null, currency, error: r.reason?.message };
  });

  res.status(200).json({ prices, usdKrw });
}
