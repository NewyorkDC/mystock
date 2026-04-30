// pages/api/market.js
// 코스피, 나스닥, 원유, 환율 실시간 조회

const FINNHUB_KEY = process.env.FINNHUB_KEY || "d7ou9apr01qmthudj7fgd7ou9apr01qmthudj7g0";

function fmt(v, decimals=2){
  if(v==null)return"—";
  return Number(v).toLocaleString("en-US",{maximumFractionDigits:decimals,minimumFractionDigits:decimals});
}

async function fetchFinnhub(symbol){
  const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
  if(!r.ok)return null;
  const d=await r.json();
  if(!d.c||d.c===0)return null;
  return{price:d.c,change:d.d,changePct:d.dp};
}

async function fetchNaver(code){
  const r=await fetch(`https://m.stock.naver.com/api/index/${code}/basic`,{headers:{"User-Agent":"Mozilla/5.0"}});
  if(!r.ok)return null;
  const d=await r.json();
  const price=parseFloat((d.closePrice||d.currentPrice||"").replace(/,/g,""));
  const change=parseFloat((d.compareToPreviousPrice||"").replace(/,/g,""));
  const changePct=parseFloat((d.fluctuationsRatio||"").replace(/,/g,""));
  if(!price)return null;
  return{price,change,changePct};
}

async function fetchUsdKrw(){
  try{
    const r=await fetch("https://open.er-api.com/v6/latest/USD");
    if(r.ok){const d=await r.json();if(d.rates?.KRW>100)return d.rates.KRW;}
  }catch{}
  try{
    const r=await fetch("https://api.frankfurter.app/latest?from=USD&to=KRW");
    if(r.ok){const d=await r.json();if(d.rates?.KRW>100)return d.rates.KRW;}
  }catch{}
  try{
    const r=await fetch(`https://finnhub.io/api/v1/forex/rates?base=USD&token=${FINNHUB_KEY}`);
    if(r.ok){const d=await r.json();if(d.quote?.KRW>100)return d.quote.KRW;}
  }catch{}
  return 1478;
}

export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).end();

  const [kospiRaw,nasdaqRaw,oilRaw,krwRate]=await Promise.allSettled([
    fetchNaver("KOSPI"),
    fetchFinnhub("QQQ"),   // 나스닥 ETF
    fetchFinnhub("CL1!").catch(()=>fetchFinnhub("USO")), // WTI 원유
    fetchUsdKrw(),
  ]);

  function toResult(r,decimals=2){
    if(r.status!=="fulfilled"||!r.value)return{value:"—",change:"—",up:null};
    const{price,change,changePct}=r.value;
    return{
      value:fmt(price,decimals),
      change:changePct!=null?fmt(Math.abs(changePct),2)+"%":"—",
      up:changePct!=null?changePct>=0:null,
    };
  }

  const krw=krwRate.status==="fulfilled"?krwRate.value:1478;

  res.status(200).json({
    kospi:  toResult(kospiRaw,2),
    nasdaq: toResult(nasdaqRaw,2),
    oil:    toResult(oilRaw,2),
    usdkrw:{
      value:Math.round(krw).toLocaleString(),
      change:"—",
      up:null,
    },
  });
}
