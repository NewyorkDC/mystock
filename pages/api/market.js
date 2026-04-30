// pages/api/market.js
const FINNHUB_KEY = process.env.FINNHUB_KEY || "d7ou9apr01qmthudj7fgd7ou9apr01qmthudj7g0";

function fmt(v, dec=2){
  if(v==null||isNaN(v))return"—";
  return Number(v).toLocaleString("ko-KR",{maximumFractionDigits:dec,minimumFractionDigits:dec});
}

async function fetchFinnhub(symbol){
  try{
    const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`,{headers:{"User-Agent":"Mozilla/5.0"}});
    if(!r.ok)return null;
    const d=await r.json();
    if(!d.c||d.c===0)return null;
    return{price:d.c,changePct:d.dp};
  }catch{return null;}
}

async function fetchKospi(){
  // 네이버 코스피 지수
  try{
    const r=await fetch("https://m.stock.naver.com/api/index/KOSPI/basic",{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://m.stock.naver.com"}});
    if(!r.ok)throw new Error();
    const d=await r.json();
    const price=parseFloat((d.closePrice||d.currentPrice||"").replace(/,/g,""));
    const changePct=parseFloat((d.fluctuationsRatio||"0").replace(/,/g,"").replace("%",""));
    if(price>0)return{price,changePct};
  }catch{}
  // Finnhub 대체 (EWY = 한국 ETF)
  return await fetchFinnhub("EWY");
}

async function fetchOil(){
  // WTI 원유 - Finnhub
  try{
    const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=USOIL&token=${FINNHUB_KEY}`);
    if(r.ok){const d=await r.json();if(d.c&&d.c>0)return{price:d.c,changePct:d.dp};}
  }catch{}
  // USO ETF 대체
  return await fetchFinnhub("USO");
}

async function fetchUsdKrw(){
  // ExchangeRate-API (무료)
  try{
    const r=await fetch("https://open.er-api.com/v6/latest/USD",{headers:{"User-Agent":"Mozilla/5.0"}});
    if(r.ok){const d=await r.json();if(d.rates?.KRW>100)return d.rates.KRW;}
  }catch{}
  // Frankfurter
  try{
    const r=await fetch("https://api.frankfurter.app/latest?from=USD&to=KRW",{headers:{"User-Agent":"Mozilla/5.0"}});
    if(r.ok){const d=await r.json();if(d.rates?.KRW>100)return d.rates.KRW;}
  }catch{}
  // Finnhub forex
  try{
    const r=await fetch(`https://finnhub.io/api/v1/forex/rates?base=USD&token=${FINNHUB_KEY}`);
    if(r.ok){const d=await r.json();if(d.quote?.KRW>100)return d.quote.KRW;}
  }catch{}
  return 1478;
}

export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).end();

  const[kospiR,nasdaqR,oilR,krwR]=await Promise.allSettled([
    fetchKospi(),
    fetchFinnhub("QQQ"),
    fetchOil(),
    fetchUsdKrw(),
  ]);

  function toCard(r,dec=2){
    if(r.status!=="fulfilled"||!r.value)return{value:"—",change:null,up:null};
    const{price,changePct}=r.value;
    return{
      value:fmt(price,dec),
      change:changePct!=null?`${changePct>=0?"+":""}${fmt(Math.abs(changePct),2)}%`:null,
      up:changePct!=null?changePct>=0:null,
    };
  }

  const krw=krwR.status==="fulfilled"?krwR.value:1478;

  res.status(200).json({
    kospi:  toCard(kospiR,2),
    nasdaq: toCard(nasdaqR,2),
    oil:    toCard(oilR,2),
    usdkrw:{value:Math.round(krw).toLocaleString("ko-KR"),change:null,up:null},
  });
}
