// pages/api/prices.js
// 서버에서 실행 → CORS 문제 없음

const FINNHUB_KEY = process.env.FINNHUB_KEY || "d7ou9apr01qmthudj7fgd7ou9apr01qmthudj7g0";

async function fetchKR(ticker) {
  const code = ticker.split(".")[0];
  const res = await fetch(
    `https://m.stock.naver.com/api/stock/${code}/basic`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    }
  );
  if (!res.ok) throw new Error(`Naver ${res.status}`);
  const d = await res.json();
  const raw = d.closePrice || d.currentPrice || "";
  const price = parseFloat(raw.replace(/,/g, ""));
  if (!price) throw new Error("price parse fail");
  return { price, currency: "KRW" };
}

async function fetchUS(ticker) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`Finnhub ${res.status}`);
  const d = await res.json();
  if (!d.c || d.c === 0) throw new Error("no price");
  return { price: d.c, currency: "USD" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { tickers } = req.body; // [{ ticker: "TSM", isKR: false }, ...]
  if (!tickers || !Array.isArray(tickers)) {
    return res.status(400).json({ error: "tickers required" });
  }

  const results = await Promise.allSettled(
    tickers.map(({ ticker, isKR }) =>
      isKR ? fetchKR(ticker) : fetchUS(ticker)
    )
  );

  const prices = tickers.map(({ ticker }, i) => {
    if (results[i].status === "fulfilled") {
      return { ticker, ...results[i].value, error: null };
    }
    return {
      ticker,
      price: null,
      currency: ticker.includes(".K") ? "KRW" : "USD",
      error: results[i].reason?.message || "failed",
    };
  });

  res.status(200).json({ prices });
}
