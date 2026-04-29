import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

const COLORS = ["#4f8ef7","#10b981","#f59e0b","#8b5cf6","#ec4899","#f97316","#06b6d4","#26c06a","#f04060","#a78bfa"];
const UP="#26c06a",DOWN="#f04060",ACC="#4f8ef7";
const BG="#0a0c10",SUR="#13161e",SUR2="#1a1e2a",BOR="#242836",TEXT="#e8ecf4",MUTED="#5a6380";

function makeId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
function load(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}}

async function fetchPrices(stocks){
  const tickers=stocks.filter(s=>s.ticker).map(s=>({ticker:s.ticker,isKR:s.ticker.includes(".K")}));
  if(!tickers.length)return{prices:[],usdKrw:1450};
  const res=await fetch("/api/prices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tickers,fetchRate:true})});
  if(!res.ok)throw new Error(`서버 오류 ${res.status}`);
  return res.json();
}

function Toast({msg}){
  if(!msg)return null;
  return <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:SUR2,border:`1px solid ${BOR}`,color:TEXT,padding:"10px 20px",borderRadius:20,fontSize:13,zIndex:999,pointerEvents:"none",whiteSpace:"nowrap",maxWidth:"90vw"}}>{msg}</div>;
}

function TabBar({tab,setTab}){
  const tabs=[{id:"dash",icon:"◈",label:"자산"},{id:"history",icon:"↗",label:"추이"},{id:"accounts",icon:"⊟",label:"계좌"}];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:SUR,borderTop:`1px solid ${BOR}`,display:"flex"}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 0 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <span style={{fontSize:22,color:tab===t.id?ACC:MUTED}}>{t.icon}</span>
          <span style={{fontSize:11,color:tab===t.id?ACC:MUTED,fontWeight:tab===t.id?700:400}}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function DonutChart({slices,size=160}){
  const r=60,cx=80,cy=80,stroke=24,circ=2*Math.PI*r;
  const total=slices.reduce((a,s)=>a+s.value,0);
  if(total===0)return<div style={{width:size,height:size,borderRadius:"50%",background:SUR2,margin:"0 auto"}}/>;
  let offset=0;
  return(
    <svg width={size} height={size} viewBox="0 0 160 160">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={SUR2} strokeWidth={stroke}/>
      {slices.map((s,i)=>{
        const dash=(s.value/total)*circ;
        const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-offset} style={{transform:"rotate(-90deg)",transformOrigin:"center"}}/>;
        offset+=dash;return el;
      })}
    </svg>
  );
}

function DashTab({accounts,usdKrw,onRefresh,loading,updated}){
  const toKrw=(v,c)=>c==="USD"?v*usdKrw:v;
  const allStocks=accounts.flatMap(a=>a.stocks||[]);
  const totalAsset=allStocks.reduce((a,s)=>s.currentPrice&&s.qty?a+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):a,0);
  const totalBuy=allStocks.reduce((a,s)=>s.buyPrice&&s.qty?a+toKrw(s.buyPrice*s.qty,s.currency||"KRW"):a,0);
  const profit=totalAsset-totalBuy;
  const rate=totalBuy>0?profit/totalBuy*100:0;

  const accSlices=accounts.map((a,i)=>({
    label:a.name,color:COLORS[i%COLORS.length],
    value:(a.stocks||[]).reduce((acc,s)=>s.currentPrice&&s.qty?acc+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):acc,0)
  })).filter(s=>s.value>0);

  const stockSlices=allStocks.filter(s=>s.currentPrice&&s.qty)
    .map((s,i)=>({label:s.name,color:COLORS[i%COLORS.length],value:toKrw(s.currentPrice*s.qty,s.currency||"KRW")}))
    .sort((a,b)=>b.value-a.value).slice(0,8);

  return(
    <div style={{padding:"16px 16px 100px"}}>
      {/* 총자산 카드 */}
      <div style={{background:"linear-gradient(135deg,#1a2a4a,#0d1a30)",borderRadius:20,padding:"24px 20px 20px",marginBottom:14,border:"1px solid #1e3050"}}>
        <div style={{fontSize:12,color:"#7090b0",marginBottom:6,letterSpacing:1}}>총 평가 자산</div>
        <div style={{fontSize:36,fontWeight:800,color:TEXT,marginBottom:6,fontFamily:"monospace",lineHeight:1.1}}>
          {totalAsset>0?"₩"+Math.round(totalAsset).toLocaleString():"₩ —"}
        </div>
        {totalAsset>0&&(
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <span style={{fontSize:17,fontWeight:700,color:profit>=0?UP:DOWN}}>{profit>=0?"+":"-"}₩{Math.abs(Math.round(profit)).toLocaleString()}</span>
            <span style={{fontSize:14,fontWeight:700,color:profit>=0?UP:DOWN,background:profit>=0?"rgba(38,192,106,.15)":"rgba(240,64,96,.15)",padding:"3px 11px",borderRadius:20}}>
              {rate>=0?"+":""}{rate.toFixed(2)}%
            </span>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#5a6a80"}}>{updated?`업데이트 ${updated}`:"시세 미조회"}</span>
          <button onClick={onRefresh} disabled={loading} style={{fontSize:13,padding:"7px 16px",borderRadius:10,background:loading?"#1e2a3a":ACC,border:"none",color:"#fff",cursor:"pointer",opacity:loading?0.6:1,fontFamily:"inherit"}}>
            <span style={loading?{display:"inline-block",animation:"spin 1s linear infinite"}:{}}>↻</span>{" "}{loading?"조회중":"시세 조회"}
          </button>
        </div>
      </div>

      {/* 계좌별 도넛 */}
      {accSlices.length>0&&(
        <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:16,padding:"18px 16px",marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:MUTED,marginBottom:14}}>계좌별 비중</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <DonutChart slices={accSlices} size={140}/>
            <div style={{flex:1}}>
              {accSlices.map((s,i)=>{
                const tot=accSlices.reduce((a,x)=>a+x.value,0);
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                    <span style={{fontSize:13,color:TEXT,flex:1}}>{s.label}</span>
                    <span style={{fontSize:12,fontFamily:"monospace",color:MUTED}}>{(s.value/tot*100).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 종목별 도넛 */}
      {stockSlices.length>0&&(
        <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:16,padding:"18px 16px",marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:MUTED,marginBottom:14}}>종목별 비중</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <DonutChart slices={stockSlices} size={140}/>
            <div style={{flex:1}}>
              {stockSlices.map((s,i)=>{
                const tot=stockSlices.reduce((a,x)=>a+x.value,0);
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                    <span style={{fontSize:12,color:TEXT,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.label}</span>
                    <span style={{fontSize:11,fontFamily:"monospace",color:MUTED}}>{(s.value/tot*100).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:12,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:13,color:MUTED}}>USD/KRW 환율</span>
        <span style={{fontSize:15,fontFamily:"monospace",fontWeight:700,color:TEXT}}>₩{usdKrw.toLocaleString()}</span>
      </div>

      {accounts.length===0&&(
        <div style={{textAlign:"center",padding:"40px 20px",color:MUTED,marginTop:20}}>
          <div style={{fontSize:40,marginBottom:12}}>📊</div>
          <p style={{fontSize:14,lineHeight:1.8}}>계좌 탭에서 계좌를 추가하고<br/>종목을 입력해주세요</p>
        </div>
      )}
    </div>
  );
}

function HistoryTab({history,accounts,usdKrw}){
  const toKrw=(v,c)=>c==="USD"?v*usdKrw:v;
  const curTotal=accounts.flatMap(a=>a.stocks||[]).reduce((a,s)=>s.currentPrice&&s.qty?a+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):a,0);
  const today=new Date().toLocaleDateString("ko-KR",{month:"numeric",day:"numeric"});
  const pts=[...history];
  if(curTotal>0&&(!pts.length||pts[pts.length-1].date!==today))pts.push({date:today,total:Math.round(curTotal)});

  if(pts.length<2)return(
    <div style={{padding:"60px 20px",textAlign:"center",color:MUTED}}>
      <div style={{fontSize:40,marginBottom:12}}>📈</div>
      <p style={{fontSize:14,lineHeight:1.8}}>시세 조회를 하면<br/>자동으로 추이가 기록돼요.<br/>매일 조회할수록 더 예쁜 그래프가 돼요!</p>
    </div>
  );

  const W=320,H=150,PX=12,PY=16;
  const vals=pts.map(p=>p.total);
  const maxV=Math.max(...vals),minV=Math.min(...vals),rng=maxV-minV||1;
  const points=pts.map((p,i)=>({
    x:PX+(i/(pts.length-1))*(W-PX*2),
    y:PY+(1-(p.total-minV)/rng)*(H-PY*2),
    ...p
  }));
  const pathD=points.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD=pathD+` L${points[points.length-1].x},${H} L${points[0].x},${H} Z`;
  const change=pts[pts.length-1].total-pts[0].total;
  const changeRate=pts[0].total>0?change/pts[0].total*100:0;
  const col=change>=0?UP:DOWN;

  return(
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{background:"linear-gradient(135deg,#1a2a4a,#0d1a30)",borderRadius:20,padding:"22px 20px",marginBottom:14,border:"1px solid #1e3050"}}>
        <div style={{fontSize:12,color:"#7090b0",marginBottom:6,letterSpacing:1}}>전체 기간 변동</div>
        <div style={{fontSize:28,fontWeight:800,fontFamily:"monospace",color:TEXT}}>{change>=0?"+":"-"}₩{Math.abs(Math.round(change)).toLocaleString()}</div>
        <div style={{fontSize:15,color:col,fontWeight:600,marginTop:4}}>{changeRate>=0?"+":""}{changeRate.toFixed(2)}% · {pts.length}회 기록</div>
      </div>

      <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:16,padding:"18px 16px",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:MUTED,marginBottom:14}}>자산 추이</div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{height:150,display:"block"}}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={col} stopOpacity="0.25"/>
              <stop offset="100%" stopColor={col} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#g)"/>
          <path d={pathD} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {points.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3.5" fill={col} stroke={SUR} strokeWidth="2"/>)}
        </svg>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:8,padding:`0 ${PX}px`}}>
          {[points[0],points[Math.floor(points.length/2)],points[points.length-1]].map((p,i)=>(
            <span key={i} style={{fontSize:10,color:MUTED}}>{p.date}</span>
          ))}
        </div>
      </div>

      <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:16,padding:"16px"}}>
        <div style={{fontSize:13,fontWeight:700,color:MUTED,marginBottom:12}}>기록 내역</div>
        {[...pts].reverse().map((p,i,arr)=>{
          const prev=arr[i+1];const diff=prev?p.total-prev.total:null;
          return(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:i<arr.length-1?`1px solid ${BOR}`:"none"}}>
              <span style={{fontSize:13,color:MUTED}}>{p.date}</span>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:15,fontFamily:"monospace",fontWeight:700,color:TEXT}}>₩{p.total.toLocaleString()}</div>
                {diff!==null&&<div style={{fontSize:11,color:diff>0?UP:diff<0?DOWN:MUTED}}>{diff>0?"+":""}{diff.toLocaleString()}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SECTORS=["건설","배터리","반도체","통신","바이오","금융","IT","미국","기타"];

function StockModal({stock,onClose,onSave}){
  const [name,setName]=useState(stock?.name||"");
  const [buy,setBuy]=useState(stock?.buyPrice||"");
  const [qty,setQty]=useState(stock?.qty||"");
  const [sector,setSector]=useState(stock?.sector||"건설");
  const [ticker,setTicker]=useState(stock?.ticker||"");
  const inp={background:BG,border:`1px solid ${BOR}`,borderRadius:10,color:TEXT,fontSize:15,padding:"11px 14px",width:"100%",fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:400}}>
      <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:"20px 20px 0 0",padding:"22px 20px 40px",width:"100%",maxWidth:480}}>
        <div style={{fontSize:17,fontWeight:700,marginBottom:16}}>{stock?"종목 수정":"종목 추가"}</div>
        <div style={{marginBottom:10}}><div style={{fontSize:11,color:MUTED,marginBottom:5}}>종목명</div><input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="예: 삼성전자, TSMC"/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><div style={{fontSize:11,color:MUTED,marginBottom:5}}>매수 평균가</div><input style={inp} type="number" value={buy} onChange={e=>setBuy(e.target.value)} placeholder="0"/></div>
          <div><div style={{fontSize:11,color:MUTED,marginBottom:5}}>보유 수량</div><input style={inp} type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0" step="any"/></div>
        </div>
        <div style={{marginBottom:10}}><div style={{fontSize:11,color:MUTED,marginBottom:5}}>섹터</div>
          <select style={inp} value={sector} onChange={e=>setSector(e.target.value)}>{SECTORS.map(s=><option key={s} value={s}>{s}</option>)}</select>
        </div>
        <div><div style={{fontSize:11,color:MUTED,marginBottom:5}}>티커 심볼</div>
          <input style={inp} value={ticker} onChange={e=>setTicker(e.target.value)} placeholder="미국: TSM · 한국: 005930.KS"/>
          <div style={{fontSize:10,color:MUTED,marginTop:4,lineHeight:1.6}}>🇰🇷 코스피: 종목코드.KS &nbsp;·&nbsp; 코스닥: 종목코드.KQ &nbsp;&nbsp; 🇺🇸 미국: TSM · AAPL 등</div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={onClose} style={{flex:1,padding:13,borderRadius:12,background:SUR2,border:`1px solid ${BOR}`,color:TEXT,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>취소</button>
          <button onClick={()=>name&&buy&&onSave({name:name.trim(),buyPrice:parseFloat(buy),qty:parseFloat(qty)||0,sector,ticker:ticker.trim()})} style={{flex:2,padding:13,borderRadius:12,background:ACC,border:"none",color:"#fff",fontSize:15,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>{stock?"저장하기":"추가하기"}</button>
        </div>
      </div>
    </div>
  );
}

function AccountsTab({accounts,setAccounts,usdKrw,onRefresh,loading}){
  const [showAdd,setShowAdd]=useState(false);
  const [newName,setNewName]=useState("");
  const [expanded,setExpanded]=useState(null);
  const [stockModal,setStockModal]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [toast,setToast]=useState("");
  function showToast(m){setToast(m);setTimeout(()=>setToast(""),2500);}
  const toKrw=(v,c)=>c==="USD"?v*usdKrw:v;

  function addAcc(){if(!newName.trim())return;setAccounts([...accounts,{id:makeId(),name:newName.trim(),stocks:[]}]);setNewName("");setShowAdd(false);showToast("계좌 추가됐어요 ✓");}
  function delAcc(id){setAccounts(accounts.filter(a=>a.id!==id));setConfirmDel(null);showToast("계좌 삭제됐어요");}
  function saveStock(accId,data,editId){
    setAccounts(accounts.map(a=>{
      if(a.id!==accId)return a;
      const stocks=editId?a.stocks.map(s=>s.id===editId?{...s,...data}:s):[...(a.stocks||[]),{id:makeId(),...data,currentPrice:null,currency:data.sector==="미국"?"USD":"KRW"}];
      return{...a,stocks};
    }));
    setStockModal(null);showToast(editId?"수정됐어요 ✓":"종목 추가됐어요 ✓");
  }
  function delStock(accId,sid){setAccounts(accounts.map(a=>a.id!==accId?a:{...a,stocks:(a.stocks||[]).filter(s=>s.id!==sid)}));setConfirmDel(null);showToast("삭제됐어요");}
  const inp={background:BG,border:`1px solid ${BOR}`,borderRadius:10,color:TEXT,fontSize:15,padding:"11px 14px",width:"100%",fontFamily:"inherit",outline:"none",boxSizing:"border-box"};

  // 전체 합산
  const allS=accounts.flatMap(a=>a.stocks||[]);
  const tot=allS.reduce((a,s)=>s.currentPrice&&s.qty?a+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):a,0);
  const buy=allS.reduce((a,s)=>s.buyPrice&&s.qty?a+toKrw(s.buyPrice*s.qty,s.currency||"KRW"):a,0);
  const pnl=tot-buy;const pr=buy>0?pnl/buy*100:0;

  return(
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{fontSize:19,fontWeight:700}}>내 계좌</span>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onRefresh} disabled={loading} style={{fontSize:12,padding:"7px 14px",borderRadius:9,background:ACC,border:"none",color:"#fff",cursor:loading?"not-allowed":"pointer",opacity:loading?0.5:1,fontFamily:"inherit"}}>
            <span style={loading?{display:"inline-block",animation:"spin 1s linear infinite"}:{}}>↻</span>{" "}시세
          </button>
          <button onClick={()=>setShowAdd(true)} style={{fontSize:12,padding:"7px 14px",borderRadius:9,background:SUR2,border:`1px solid ${BOR}`,color:TEXT,cursor:"pointer",fontFamily:"inherit"}}>+ 계좌</button>
        </div>
      </div>

      {accounts.length>0&&(
        <div style={{background:"linear-gradient(135deg,#1a2a4a,#0d1a30)",border:"1px solid #1e3050",borderRadius:16,padding:"16px 18px",marginBottom:14}}>
          <div style={{fontSize:11,color:"#7090b0",marginBottom:4}}>전체 계좌 합산</div>
          <div style={{fontSize:26,fontWeight:800,fontFamily:"monospace",color:TEXT}}>₩{tot>0?Math.round(tot).toLocaleString():"—"}</div>
          {tot>0&&<div style={{fontSize:14,color:pnl>=0?UP:DOWN,marginTop:3,fontWeight:600}}>{pnl>=0?"+":""}{Math.round(pnl).toLocaleString()}원 ({pr>=0?"+":""}{pr.toFixed(2)}%)</div>}
        </div>
      )}

      {accounts.map((acc,ai)=>{
        const stocks=acc.stocks||[];
        const aT=stocks.reduce((a,s)=>s.currentPrice&&s.qty?a+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):a,0);
        const aB=stocks.reduce((a,s)=>s.buyPrice&&s.qty?a+toKrw(s.buyPrice*s.qty,s.currency||"KRW"):a,0);
        const aPnl=aT-aB;const aR=aB>0?aPnl/aB*100:0;
        const open=expanded===acc.id;const col=COLORS[ai%COLORS.length];
        return(
          <div key={acc.id} style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:16,marginBottom:12,overflow:"hidden"}}>
            <div onClick={()=>setExpanded(open?null:acc.id)} style={{padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:col,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:600,color:TEXT,marginBottom:2}}>{acc.name}</div>
                <div style={{fontSize:11,color:MUTED}}>{stocks.length}종목</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:16,fontFamily:"monospace",fontWeight:700,color:TEXT}}>{aT>0?"₩"+Math.round(aT).toLocaleString():"—"}</div>
                {aT>0&&<div style={{fontSize:12,color:aPnl>=0?UP:DOWN}}>{aPnl>=0?"+":""}{aR.toFixed(2)}%</div>}
              </div>
              <span style={{color:MUTED,fontSize:14,marginLeft:4}}>{open?"▲":"▼"}</span>
            </div>

            {open&&(
              <div style={{borderTop:`1px solid ${BOR}`}}>
                {stocks.map(s=>{
                  const rate=s.currentPrice&&s.buyPrice?(s.currentPrice-s.buyPrice)/s.buyPrice*100:null;
                  const asset=s.currentPrice&&s.qty?s.currentPrice*s.qty:null;
                  return(
                    <div key={s.id} style={{padding:"12px 16px",borderBottom:`1px solid rgba(36,40,54,.5)`,display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:500,color:TEXT,marginBottom:2}}>{s.name}</div>
                        <div style={{fontSize:11,color:MUTED,fontFamily:"monospace",display:"flex",gap:6,flexWrap:"wrap"}}>
                          <span>매수 {Number(s.buyPrice).toLocaleString()}</span>
                          {s.qty>0&&<span>{s.qty}주</span>}
                          {s.ticker&&<span style={{color:ACC}}>{s.ticker}</span>}
                        </div>
                        {asset!=null&&<div style={{fontSize:11,color:ACC,fontFamily:"monospace",marginTop:1}}>평가 {asset.toLocaleString(undefined,{maximumFractionDigits:0})} {s.currency}</div>}
                      </div>
                      <div style={{textAlign:"right",flexShrink:0,marginRight:8}}>
                        {s.currentPrice?<div style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:TEXT,marginBottom:3}}>{s.currentPrice.toLocaleString(undefined,{maximumFractionDigits:2})} <span style={{fontSize:10,color:MUTED}}>{s.currency}</span></div>:<div style={{fontSize:12,color:MUTED,marginBottom:3}}>조회 전</div>}
                        {rate!=null?<span style={{fontSize:12,fontFamily:"monospace",fontWeight:700,padding:"2px 7px",borderRadius:5,background:rate>0?"rgba(38,192,106,.15)":"rgba(240,64,96,.15)",color:rate>0?UP:DOWN}}>{rate>0?"+":""}{rate.toFixed(2)}%</span>:<span style={{fontSize:12,padding:"2px 7px",borderRadius:5,background:SUR2,color:MUTED}}>—</span>}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        {confirmDel?.sid===s.id?(
                          <><button onClick={()=>delStock(acc.id,s.id)} style={{padding:"3px 8px",borderRadius:7,border:"none",background:DOWN,color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700}}>삭제</button>
                          <button onClick={()=>setConfirmDel(null)} style={{padding:"3px 8px",borderRadius:7,border:`1px solid ${BOR}`,background:SUR2,color:MUTED,cursor:"pointer",fontSize:11}}>취소</button></>
                        ):(
                          <><button onClick={()=>setStockModal({accId:acc.id,stock:s})} style={{width:26,height:26,borderRadius:7,border:`1px solid ${BOR}`,background:SUR2,color:MUTED,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✎</button>
                          <button onClick={()=>setConfirmDel({sid:s.id})} style={{width:26,height:26,borderRadius:7,border:"1px solid rgba(240,64,96,.4)",background:"rgba(240,64,96,.1)",color:DOWN,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div style={{padding:"12px 16px",display:"flex",gap:8}}>
                  <button onClick={()=>setStockModal({accId:acc.id})} style={{flex:1,padding:"10px",borderRadius:10,background:ACC,border:"none",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>+ 종목 추가</button>
                  {confirmDel?.aid===acc.id?(
                    <><button onClick={()=>delAcc(acc.id)} style={{padding:"10px 14px",borderRadius:10,border:"none",background:DOWN,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>삭제확인</button>
                    <button onClick={()=>setConfirmDel(null)} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${BOR}`,background:SUR2,color:MUTED,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>취소</button></>
                  ):(
                    <button onClick={()=>setConfirmDel({aid:acc.id})} style={{padding:"10px 14px",borderRadius:10,border:"1px solid rgba(240,64,96,.3)",background:"transparent",color:DOWN,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>삭제</button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {accounts.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:MUTED}}><div style={{fontSize:40,marginBottom:12}}>🏦</div><p style={{fontSize:14,lineHeight:1.8}}>위 "+ 계좌" 버튼으로<br/>계좌를 추가하세요</p></div>}

      {showAdd&&(
        <div onClick={e=>e.target===e.currentTarget&&setShowAdd(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300}}>
          <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:"20px 20px 0 0",padding:"22px 20px 36px",width:"100%",maxWidth:480}}>
            <div style={{fontSize:17,fontWeight:700,marginBottom:16}}>계좌 추가</div>
            <div style={{fontSize:11,color:MUTED,marginBottom:6}}>계좌 이름</div>
            <input style={inp} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="예: 키움증권, 삼성증권" autoFocus onKeyDown={e=>e.key==="Enter"&&addAcc()}/>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:13,borderRadius:12,background:SUR2,border:`1px solid ${BOR}`,color:TEXT,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>취소</button>
              <button onClick={addAcc} style={{flex:2,padding:13,borderRadius:12,background:ACC,border:"none",color:"#fff",fontSize:15,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>추가하기</button>
            </div>
          </div>
        </div>
      )}

      {stockModal&&<StockModal stock={stockModal.stock} onClose={()=>setStockModal(null)} onSave={data=>saveStock(stockModal.accId,data,stockModal.stock?.id)}/>}
      <Toast msg={toast}/>
    </div>
  );
}

export default function App(){
  const [tab,setTab]=useState("dash");
  const [accounts,setAccountsRaw]=useState(()=>load("accounts",[]));
  const [history,setHistory]=useState(()=>load("assetHistory",[]));
  const [usdKrw,setUsdKrw]=useState(1450);
  const [loading,setLoading]=useState(false);
  const [updated,setUpdated]=useState("");
  const [toast,setToast]=useState("");

  function showToast(m){setToast(m);setTimeout(()=>setToast(""),3000);}
  function setAccounts(v){setAccountsRaw(v);save("accounts",v);}

  const refresh=useCallback(async()=>{
    if(loading)return;
    setLoading(true);
    try{
      const allS=accounts.flatMap(a=>a.stocks||[]);
      const result=await fetchPrices(allS);
      const prices=result.prices||[];
      const rate=result.usdKrw||1450;
      setUsdKrw(rate);
      const toKrw=(v,c)=>c==="USD"?v*rate:v;

      const updated=accounts.map(a=>({...a,stocks:(a.stocks||[]).map(s=>{
        const p=prices.find(p=>p.ticker===s.ticker);
        return p?.price?{...s,currentPrice:p.price,currency:p.currency||s.currency}:s;
      })}));
      setAccounts(updated);

      const total=updated.flatMap(a=>a.stocks||[]).reduce((a,s)=>s.currentPrice&&s.qty?a+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):a,0);
      if(total>0){
        const today=new Date().toLocaleDateString("ko-KR",{month:"numeric",day:"numeric"});
        const newH=[...history.filter(h=>h.date!==today),{date:today,total:Math.round(total)}].slice(-60);
        setHistory(newH);save("assetHistory",newH);
      }

      const now=new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});
      setUpdated(now);
      const failed=prices.filter(p=>!p.price).map(p=>p.ticker);
      showToast(failed.length?`완료 — 실패: ${failed.join(", ")}`:`시세 업데이트 완료 ✓ (₩${rate.toLocaleString()})`);
    }catch(e){showToast("⚠ "+e.message.slice(0,50));}
    setLoading(false);
  },[accounts,history,loading]);

  return(
    <>
      <Head>
        <title>MyStock</title>
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&display=swap" rel="stylesheet"/>
      </Head>
      <div style={{background:BG,minHeight:"100vh",color:TEXT,fontFamily:"'Noto Sans KR',sans-serif"}}>
        <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{background:${BG};}@keyframes spin{to{transform:rotate(360deg);}}select option{background:${SUR2};}`}</style>
        {tab==="dash"&&<DashTab accounts={accounts} usdKrw={usdKrw} onRefresh={refresh} loading={loading} updated={updated}/>}
        {tab==="history"&&<HistoryTab history={history} accounts={accounts} usdKrw={usdKrw}/>}
        {tab==="accounts"&&<AccountsTab accounts={accounts} setAccounts={setAccounts} usdKrw={usdKrw} onRefresh={refresh} loading={loading}/>}
        <TabBar tab={tab} setTab={setTab}/>
        <Toast msg={toast}/>
      </div>
    </>
  );
}
