import React,{useState,useEffect,useCallback,useRef}from"react";
import Head from"next/head";
import{useSession,signIn,signOut}from"next-auth/react";

const COLORS=["#4f8ef7","#10b981","#f59e0b","#8b5cf6","#ec4899","#f97316","#06b6d4","#26c06a","#f04060","#a78bfa"];
const UP="#26c06a",DOWN="#f04060",ACC="#4f8ef7";
const BG="#0a0c10",SUR="#13161e",SUR2="#1a1e2a",BOR="#242836",TEXT="#e8ecf4",MUTED="#5a6380";
const DEFAULT_SECTORS=["건설","배터리","반도체","통신","바이오","금융","IT","미국","ETF","기타"];

function makeId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5);}

function useDrag(items,onReorder){
  const[dragging,setDragging]=useState(null);
  const[over,setOver]=useState(null);
  const timer=useRef(null);
  function commit(f,t){
    if(f===null||t===null||f===t)return;
    const n=[...items];const[m]=n.splice(f,1);n.splice(t,0,m);onReorder(n);
  }
  function end(){commit(dragging,over);setDragging(null);setOver(null);}
  const bind=(idx)=>({
    "data-drag":idx,
    onMouseDown:()=>{timer.current=setTimeout(()=>setDragging(idx),350);},
    onMouseUp:()=>{clearTimeout(timer.current);if(dragging!==null)end();},
    onMouseEnter:()=>{if(dragging!==null)setOver(idx);},
    onTouchStart:(e)=>{timer.current=setTimeout(()=>{setDragging(idx);e.preventDefault();},350);},
    onTouchEnd:()=>{clearTimeout(timer.current);if(dragging!==null)end();},
    onTouchMove:(e)=>{
      if(dragging===null){clearTimeout(timer.current);return;}
      e.preventDefault();
      const t=e.touches[0];
      const el=document.elementFromPoint(t.clientX,t.clientY)?.closest("[data-drag]");
      if(el){const i=parseInt(el.dataset.drag);if(!isNaN(i))setOver(i);}
    },
    style:{cursor:dragging===null?"grab":"grabbing",opacity:dragging===idx?0.4:1,outline:over===idx&&dragging!==idx?`2px solid ${ACC}`:"none",transition:"opacity 0.15s",userSelect:"none",borderRadius:0},
  });
  return bind;
}

function Toast({msg}){
  if(!msg)return null;
  return<div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:SUR2,border:`1px solid ${BOR}`,color:TEXT,padding:"10px 20px",borderRadius:20,fontSize:13,zIndex:999,pointerEvents:"none",whiteSpace:"nowrap",maxWidth:"88vw",overflow:"hidden",textOverflow:"ellipsis"}}>{msg}</div>;
}

function TabBar({tab,setTab}){
  const tabs=[{id:"dash",label:"자산홈"},{id:"history",label:"자산분석"},{id:"chart",label:"차트"},{id:"accounts",label:"계좌"}];
  return(
    <div style={{background:SUR,borderBottom:`1px solid ${BOR}`,display:"flex",overflowX:"auto",scrollbarWidth:"none"}}>
      <style>{`.tab-scroll::-webkit-scrollbar{display:none}`}</style>
      <div className="tab-scroll" style={{display:"flex",minWidth:"max-content",padding:"0 4px"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"12px 16px",background:"none",border:"none",cursor:"pointer",
            fontSize:14,fontWeight:tab===t.id?700:400,
            color:tab===t.id?TEXT:MUTED,
            borderBottom:tab===t.id?`2px solid ${ACC}`:"2px solid transparent",
            whiteSpace:"nowrap",fontFamily:"inherit",transition:"all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>
    </div>
  );
}

function DonutChart({slices,size=160}){
  const r=60,cx=80,cy=80,stroke=24,circ=2*Math.PI*r;
  const total=slices.reduce((a,s)=>a+s.value,0);
  if(!total)return<div style={{width:size,height:size,borderRadius:"50%",background:SUR2,margin:"0 auto"}}/>;
  let offset=0;
  return(
    <svg width={size} height={size} viewBox="0 0 160 160">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={SUR2} strokeWidth={stroke}/>
      {slices.map((s,i)=>{const dash=(s.value/total)*circ;const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-offset} style={{transform:"rotate(-90deg)",transformOrigin:"center"}}/>;offset+=dash;return el;})}
    </svg>
  );
}

function LoginScreen(){
  const[loading,setLoading]=useState(false);
  return(
    <div style={{background:BG,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Noto Sans KR',sans-serif",color:TEXT}}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>📊</div>
        <div style={{fontSize:34,fontWeight:800,marginBottom:8}}>My<span style={{color:ACC}}>Stock</span></div>
        <div style={{fontSize:15,color:MUTED,marginBottom:48}}>내 주식 포트폴리오</div>
        <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:20,padding:32}}>
          <div style={{fontSize:14,color:MUTED,marginBottom:24,lineHeight:1.7}}>구글 계정으로 로그인하면<br/>어느 기기에서든 데이터가 동기화돼요</div>
          <button onClick={()=>{setLoading(true);signIn("google");}} disabled={loading} style={{width:"100%",padding:"14px 20px",borderRadius:14,background:"#fff",border:"none",color:"#1a1a1a",fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12,opacity:loading?0.7:1,fontFamily:"inherit"}}>
            <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.5 30.1 0 24 0 14.8 0 7 5.4 3.2 13.3l7.8 6C13 13.7 18 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.8-2.2 5.2-4.7 6.8l7.3 5.7c4.3-4 6.8-9.9 6.8-16.5z"/><path fill="#FBBC05" d="M11 28.3c-.6-1.7-.9-3.5-.9-5.3s.3-3.6.9-5.3l-7.8-6C1.2 14.8 0 19.3 0 24s1.2 9.2 3.2 12.3l7.8-6z"/><path fill="#34A853" d="M24 48c6.1 0 11.2-2 14.9-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.6 2.2-6 0-11-4.2-12.8-9.8l-7.8 6C7 42.6 14.8 48 24 48z"/></svg>
            {loading?"연결 중...":"Google로 계속하기"}
          </button>
          <div style={{fontSize:11,color:MUTED,marginTop:18}}>🔒 각 계정 데이터는 완전히 분리됩니다</div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_MARKET_ITEMS=[
  {id:"kospi",label:"코스피",key:"kospi"},
  {id:"nasdaq",label:"나스닥",key:"nasdaq"},
  {id:"oil",label:"WTI 원유",key:"oil"},
  {id:"usdkrw",label:"원/달러",key:"usdkrw"},
];

function MarketBar({usdKrw,setUsdKrw}){
  const[data,setData]=useState({});
  const[loading,setLoading]=useState(false);
  const[items,setItems]=useState(()=>{
    try{const s=localStorage.getItem("marketItems");return s?JSON.parse(s):DEFAULT_MARKET_ITEMS;}catch{return DEFAULT_MARKET_ITEMS;}
  });
  const[showAdd,setShowAdd]=useState(false);
  const[newLabel,setNewLabel]=useState("");
  const[newTicker,setNewTicker]=useState("");

  async function fetchMarket(){
    setLoading(true);
    try{
      const res=await fetch("/api/market");
      if(res.ok){
        const d=await res.json();
        setData(d);
        if(d.usdkrw?.value){
          const rate=parseFloat(d.usdkrw.value.replace(/,/g,""));
          if(rate>100)setUsdKrw(rate);
        }
      }
    }catch{}
    const custom=items.filter(i=>i.ticker);
    if(custom.length>0){
      try{
        const res=await fetch("/api/prices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tickers:custom.map(i=>({ticker:i.ticker,isKR:i.ticker.includes(".K")})),fetchRate:false})});
        if(res.ok){
          const d=await res.json();
          const extra={};
          d.prices?.forEach(p=>{
            if(p.price){
              const cp=p.changePercent;
              extra[p.ticker]={
                value:p.price.toLocaleString("ko-KR",{maximumFractionDigits:2}),
                change:cp!=null?`${cp>=0?"+":""}${Math.abs(cp).toFixed(2)}%`:null,
                up:cp!=null?cp>=0:null,
              };
            }
          });
          setData(prev=>({...prev,...extra}));
        }
      }catch{}
    }
    setLoading(false);
  }

  useEffect(()=>{fetchMarket();},[]);

  function addItem(){
    if(!newLabel.trim())return;
    const newItem={id:makeId(),label:newLabel.trim(),ticker:newTicker.trim()||null,key:newTicker.trim()||null};
    const updated=[...items,newItem];
    setItems(updated);
    localStorage.setItem("marketItems",JSON.stringify(updated));
    setNewLabel("");setNewTicker("");setShowAdd(false);
    fetchMarket();
  }

  function removeItem(id){
    const updated=items.filter(i=>i.id!==id);
    setItems(updated);
    localStorage.setItem("marketItems",JSON.stringify(updated));
  }

  const inp={background:BG,border:`1px solid ${BOR}`,borderRadius:10,color:TEXT,fontSize:14,padding:"10px 12px",width:"100%",fontFamily:"inherit",outline:"none",boxSizing:"border-box"};

  return(
    <div style={{padding:"14px 16px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:700,color:MUTED}}>시장 현황</span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={fetchMarket} disabled={loading} style={{fontSize:12,padding:"4px 10px",borderRadius:7,background:SUR2,border:`1px solid ${BOR}`,color:MUTED,cursor:"pointer",fontFamily:"inherit"}}>
            <span style={loading?{display:"inline-block",animation:"spin 1s linear infinite"}:{}}>↻</span> 새로고침
          </button>
          <button onClick={()=>setShowAdd(true)} style={{fontSize:12,padding:"4px 10px",borderRadius:7,background:ACC,border:"none",color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>+ 추가</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {items.map(item=>{
          const key=item.ticker||item.key;
          const d=data[key]||{value:"—",change:null,up:null};
          return(
            <div key={item.id} style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:14,padding:"14px 16px",position:"relative"}}>
              <button onClick={()=>removeItem(item.id)} style={{position:"absolute",top:8,right:8,width:18,height:18,borderRadius:"50%",border:"none",background:"transparent",color:MUTED,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              <div style={{fontSize:12,color:MUTED,marginBottom:6}}>{item.label}</div>
              <div style={{fontSize:22,fontWeight:800,fontFamily:"monospace",color:TEXT,marginBottom:4}}>{d.value}</div>
              {d.change&&<span style={{fontSize:13,fontFamily:"monospace",fontWeight:600,color:d.up?UP:DOWN}}>{d.change}</span>}
              {!d.change&&<span style={{fontSize:12,color:MUTED}}>—</span>}
            </div>
          );
        })}
      </div>

      {showAdd&&(
        <div onClick={e=>e.target===e.currentTarget&&setShowAdd(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300}}>
          <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:"20px 20px 0 0",padding:"22px 20px 36px",width:"100%",maxWidth:480}}>
            <div style={{fontSize:17,fontWeight:700,marginBottom:16}}>관심 항목 추가</div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:MUTED,marginBottom:5}}>이름 (예: 삼성전자, 금 등)</div>
              <input style={inp} value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="표시할 이름"/>
            </div>
            <div style={{marginBottom:4}}>
              <div style={{fontSize:11,color:MUTED,marginBottom:5}}>티커 심볼 (선택)</div>
              <input style={inp} value={newTicker} onChange={e=>setNewTicker(e.target.value)} placeholder="AAPL, 005930.KS 등"/>
              <div style={{fontSize:10,color:MUTED,marginTop:4}}>비워두면 기본 지수만 표시돼요</div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:13,borderRadius:12,background:SUR2,border:`1px solid ${BOR}`,color:TEXT,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>취소</button>
              <button onClick={addItem} style={{flex:2,padding:13,borderRadius:12,background:ACC,border:"none",color:"#fff",fontSize:14,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>추가하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MarketBarInDash=MarketBar;

function DashTab({accounts,usdKrw,setUsdKrw,onRefresh,loading,updated}){
  const toKrw=(v,c)=>c==="USD"?v*usdKrw:v;
  const allS=accounts.flatMap(a=>a.stocks||[]);
  const totalAsset=allS.reduce((a,s)=>s.currentPrice&&s.qty?a+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):a,0);
  const totalBuy=allS.reduce((a,s)=>s.buyPrice&&s.qty?a+toKrw(s.buyPrice*s.qty,s.currency||"KRW"):a,0);
  const profit=totalAsset-totalBuy,rate=totalBuy>0?profit/totalBuy*100:0;
  return(
    <div style={{padding:"16px 16px 40px"}}>
      <div style={{background:"linear-gradient(135deg,#1a2a4a,#0d1a30)",borderRadius:20,padding:"24px 20px 20px",marginBottom:14,border:"1px solid #1e3050"}}>
        <div style={{fontSize:12,color:"#7090b0",marginBottom:6,letterSpacing:1}}>총 평가 자산</div>
        <div style={{fontSize:34,fontWeight:800,color:TEXT,marginBottom:6,fontFamily:"monospace",lineHeight:1.1}}>{totalAsset>0?"₩"+Math.round(totalAsset).toLocaleString():"₩ —"}</div>
        {totalAsset>0&&(<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><span style={{fontSize:17,fontWeight:700,color:profit>=0?UP:DOWN}}>{profit>=0?"+":"-"}₩{Math.abs(Math.round(profit)).toLocaleString()}</span><span style={{fontSize:14,fontWeight:700,color:profit>=0?UP:DOWN,background:profit>=0?"rgba(38,192,106,.15)":"rgba(240,64,96,.15)",padding:"3px 11px",borderRadius:20}}>{rate>=0?"+":""}{rate.toFixed(2)}%</span></div>)}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#5a6a80"}}>{updated?`업데이트 ${updated}`:"시세 미조회"}</span>
          <button onClick={onRefresh} disabled={loading} style={{fontSize:13,padding:"7px 16px",borderRadius:10,background:loading?"#1e2a3a":ACC,border:"none",color:"#fff",cursor:"pointer",opacity:loading?0.6:1,fontFamily:"inherit"}}><span style={loading?{display:"inline-block",animation:"spin 1s linear infinite"}:{}}>↻</span>{" "}{loading?"조회중":"시세 조회"}</button>
        </div>
      </div>
      <MarketBarInDash usdKrw={usdKrw} setUsdKrw={setUsdKrw}/>
      {accounts.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:MUTED,marginTop:20}}><div style={{fontSize:40,marginBottom:12}}>📊</div><p style={{fontSize:14,lineHeight:1.8}}>계좌 탭에서 계좌를 추가하고<br/>종목을 입력해주세요</p></div>}
    </div>
  );
}

function HistoryTab({history,accounts,usdKrw}){
  const toKrw=(v,c)=>c==="USD"?v*usdKrw:v;
  const curTotal=accounts.flatMap(a=>a.stocks||[]).reduce((a,s)=>s.currentPrice&&s.qty?a+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):a,0);
  const today=new Date().toLocaleDateString("ko-KR",{month:"numeric",day:"numeric"});
  const pts=[...history];
  if(curTotal>0&&(!pts.length||pts[pts.length-1].date!==today))pts.push({date:today,total:Math.round(curTotal)});

  const allStocks=accounts.flatMap(a=>a.stocks||[]);
  const totalAsset=allStocks.reduce((a,s)=>s.currentPrice&&s.qty?a+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):a,0);

  // 계좌별
  const accSlices=accounts.map((a,i)=>({
    label:a.name,color:COLORS[i%COLORS.length],
    value:(a.stocks||[]).reduce((acc,s)=>s.currentPrice&&s.qty?acc+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):acc,0)
  })).filter(s=>s.value>0);

  // 섹터별
  const sectorMap={};
  allStocks.forEach((s)=>{
    if(!s.currentPrice||!s.qty)return;
    const v=toKrw(s.currentPrice*s.qty,s.currency||"KRW");
    if(!sectorMap[s.sector])sectorMap[s.sector]={value:0,color:COLORS[Object.keys(sectorMap).length%COLORS.length]};
    sectorMap[s.sector].value+=v;
  });
  const sectorSlices=Object.entries(sectorMap).map(([label,d])=>({label,...d})).sort((a,b)=>b.value-a.value);

  // ── 종목별 비중 (신규 추가)
  const stockSlices=allStocks
    .filter(s=>s.currentPrice&&s.qty)
    .map((s,i)=>({
      label:s.name,
      ticker:s.ticker||"",
      color:COLORS[i%COLORS.length],
      value:toKrw(s.currentPrice*s.qty,s.currency||"KRW"),
      rate:s.buyPrice?(s.currentPrice-s.buyPrice)/s.buyPrice*100:null,
    }))
    .sort((a,b)=>b.value-a.value);

  // 그래프
  const hasChart=pts.length>=2;
  const W=320,H=150,PX=12,PY=16;
  const vals=pts.map(p=>p.total),maxV=Math.max(...vals),minV=Math.min(...vals),rng=maxV-minV||1;
  const points=hasChart?pts.map((p,i)=>({x:PX+(i/(pts.length-1))*(W-PX*2),y:PY+(1-(p.total-minV)/rng)*(H-PY*2),...p})):[];
  const pathD=points.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD=pathD+` L${points[points.length-1]?.x},${H} L${points[0]?.x},${H} Z`;
  const change=pts.length>=2?pts[pts.length-1].total-pts[0].total:0;
  const changeRate=pts.length>=2&&pts[0].total>0?change/pts[0].total*100:0;
  const col=change>=0?UP:DOWN;

  function PieChart({slices,size=140}){
    const r=52,cx=70,cy=70,stroke=22,circ=2*Math.PI*r;
    const total=slices.reduce((a,s)=>a+s.value,0);
    if(!total)return<div style={{width:size,height:size,borderRadius:"50%",background:SUR2}}/>;
    let offset=0;
    return(
      <svg width={size} height={size} viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={SUR2} strokeWidth={stroke}/>
        {slices.map((s,i)=>{
          const dash=(s.value/total)*circ;
          const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-offset}
            style={{transform:"rotate(-90deg)",transformOrigin:"center"}}/>;
          offset+=dash;return el;
        })}
        <text x={cx} y={cy-6} textAnchor="middle" fill={TEXT} fontSize="11" fontFamily="monospace">총자산</text>
        <text x={cx} y={cy+10} textAnchor="middle" fill={TEXT} fontSize="9" fontFamily="monospace">
          {totalAsset>0?"₩"+Math.round(totalAsset/10000).toLocaleString()+"만":"—"}
        </text>
      </svg>
    );
  }

  // 비중 섹션 공통 렌더러
  function AllocationSection({title,slices}){
    if(!slices.length)return null;
    const tot=slices.reduce((a,x)=>a+x.value,0);
    return(
      <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:16,padding:"18px 16px",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:MUTED,marginBottom:16}}>{title}</div>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <div style={{flexShrink:0}}><PieChart slices={slices} size={140}/></div>
          <div style={{flex:1}}>
            {slices.map((s,i)=>{
              const pct=(s.value/tot*100).toFixed(1);
              return(
                <div key={i} style={{marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                    <span style={{fontSize:13,color:TEXT,flex:1,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.label}</span>
                    <span style={{fontSize:13,fontFamily:"monospace",fontWeight:700,color:TEXT,flexShrink:0}}>{pct}%</span>
                  </div>
                  <div style={{height:4,borderRadius:2,background:BOR,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:s.color,borderRadius:2,transition:"width 0.5s"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                    <div style={{fontSize:10,color:MUTED,fontFamily:"monospace"}}>
                      {s.rate!=null&&<span style={{color:s.rate>=0?UP:DOWN}}>{s.rate>=0?"+":""}{s.rate.toFixed(2)}%</span>}
                    </div>
                    <div style={{fontSize:10,color:MUTED,fontFamily:"monospace"}}>
                      ₩{Math.round(s.value).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{padding:"16px 16px 40px"}}>

      {hasChart?(
        <>
          <div style={{background:"linear-gradient(135deg,#1a2a4a,#0d1a30)",borderRadius:20,padding:"20px",marginBottom:14,border:"1px solid #1e3050"}}>
            <div style={{fontSize:12,color:"#7090b0",marginBottom:4,letterSpacing:1}}>전체 기간 변동</div>
            <div style={{fontSize:26,fontWeight:800,fontFamily:"monospace",color:TEXT}}>{change>=0?"+":"-"}₩{Math.abs(Math.round(change)).toLocaleString()}</div>
            <div style={{fontSize:14,color:col,fontWeight:600,marginTop:3}}>{changeRate>=0?"+":""}{changeRate.toFixed(2)}% · {pts.length}회 기록</div>
          </div>

          <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:16,padding:"16px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:MUTED,marginBottom:12}}>자산 추이</div>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{height:150,display:"block"}}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col} stopOpacity="0.25"/>
                <stop offset="100%" stopColor={col} stopOpacity="0"/>
              </linearGradient></defs>
              <path d={areaD} fill="url(#g)"/>
              <path d={pathD} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              {points.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3.5" fill={col} stroke={SUR} strokeWidth="2"/>)}
            </svg>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,padding:`0 ${PX}px`}}>
              {[points[0],points[Math.floor(points.length/2)],points[points.length-1]].filter(Boolean).map((p,i)=>(
                <span key={i} style={{fontSize:10,color:MUTED}}>{p.date}</span>
              ))}
            </div>
          </div>

          <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:16,padding:"16px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:MUTED,marginBottom:12}}>기록 내역</div>
            {[...pts].reverse().map((p,i,arr)=>{
              const prev=arr[i+1];const diff=prev?p.total-prev.total:null;
              return(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<arr.length-1?`1px solid ${BOR}`:"none"}}>
                  <span style={{fontSize:13,color:MUTED}}>{p.date}</span>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:15,fontFamily:"monospace",fontWeight:700,color:TEXT}}>₩{p.total.toLocaleString()}</div>
                    {diff!==null&&<div style={{fontSize:11,color:diff>0?UP:diff<0?DOWN:MUTED}}>{diff>0?"+":""}{diff.toLocaleString()}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ):(
        <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:16,padding:"30px 20px",textAlign:"center",color:MUTED,marginBottom:14}}>
          <div style={{fontSize:36,marginBottom:10}}>📈</div>
          <p style={{fontSize:14,lineHeight:1.8}}>시세 조회를 하면<br/>자동으로 추이가 기록돼요!</p>
        </div>
      )}

      {totalAsset>0&&(
        <>
          <AllocationSection title="종목별 자산 비중" slices={stockSlices}/>
          <AllocationSection title="계좌별 자산 비중" slices={accSlices}/>
          <AllocationSection title="섹터별 자산 비중" slices={sectorSlices}/>
        </>
      )}
    </div>
  );
}


function StockModal({stock,onClose,onSave,customSectors=[]}){
  const[name,setName]=useState(stock?.name||"");
  const[buy,setBuy]=useState(stock?.buyPrice||"");
  const[qty,setQty]=useState(stock?.qty||"");
  const[ticker,setTicker]=useState(stock?.ticker||"");
  const[memo,setMemo]=useState(stock?.memo||"");
  const allSectors=[...new Set([...DEFAULT_SECTORS,...customSectors])];
  const initSector=stock?.sector||allSectors[0];
  const[sector,setSector]=useState(allSectors.includes(initSector)?initSector:allSectors[0]);
  const[useCustom,setUseCustom]=useState(!allSectors.includes(initSector));
  const[customSector,setCustomSector]=useState(!allSectors.includes(initSector)?initSector:"");
  const finalSector=useCustom?(customSector.trim()||"기타"):sector;
  const inp={background:BG,border:`1px solid ${BOR}`,borderRadius:10,color:TEXT,fontSize:15,padding:"11px 14px",width:"100%",fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:400}}>
      <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:"20px 20px 0 0",padding:"22px 20px 44px",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{fontSize:17,fontWeight:700,marginBottom:16}}>{stock?"종목 수정":"종목 추가"}</div>
        <div style={{marginBottom:10}}><div style={{fontSize:11,color:MUTED,marginBottom:5}}>종목명</div><input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="예: 삼성전자, TSMC"/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><div style={{fontSize:11,color:MUTED,marginBottom:5}}>매수 평균가</div><input style={inp} type="number" value={buy} onChange={e=>setBuy(e.target.value)} placeholder="0"/></div>
          <div><div style={{fontSize:11,color:MUTED,marginBottom:5}}>보유 수량</div><input style={inp} type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0" step="any"/></div>
        </div>
        <div style={{marginBottom:10}}><div style={{fontSize:11,color:MUTED,marginBottom:5}}>섹터</div>
          <div style={{display:"flex",gap:8,marginBottom:6}}><button onClick={()=>setUseCustom(false)} style={{fontSize:12,padding:"5px 12px",borderRadius:8,border:`1px solid ${useCustom?BOR:ACC}`,background:useCustom?SUR2:"rgba(79,142,247,.15)",color:useCustom?MUTED:ACC,cursor:"pointer",fontFamily:"inherit"}}>목록 선택</button><button onClick={()=>setUseCustom(true)} style={{fontSize:12,padding:"5px 12px",borderRadius:8,border:`1px solid ${useCustom?ACC:BOR}`,background:useCustom?"rgba(79,142,247,.15)":SUR2,color:useCustom?ACC:MUTED,cursor:"pointer",fontFamily:"inherit"}}>직접 입력</button></div>
          {useCustom?<input style={inp} value={customSector} onChange={e=>setCustomSector(e.target.value)} placeholder="섹터 이름 (예: 방산, 리츠)"/>:<select style={inp} value={sector} onChange={e=>setSector(e.target.value)}>{allSectors.map(s=><option key={s} value={s}>{s}</option>)}</select>}
        </div>
        <div style={{marginBottom:10}}><div style={{fontSize:11,color:MUTED,marginBottom:5}}>티커 심볼</div><input style={inp} value={ticker} onChange={e=>setTicker(e.target.value)} placeholder="미국: TSM · BRK.B · 한국: 005930.KS"/><div style={{fontSize:10,color:MUTED,marginTop:4,lineHeight:1.6}}>🇰🇷 코스피: 종목코드.KS · 코스닥: 종목코드.KQ &nbsp; 🇺🇸 미국: TSM · AAPL · BRK.B</div></div>
        <div><div style={{fontSize:11,color:MUTED,marginBottom:5}}>메모 <span style={{color:"#3a4260"}}>(선택)</span></div><textarea style={{...inp,resize:"vertical",minHeight:72,fontSize:13,lineHeight:1.5}} value={memo} onChange={e=>setMemo(e.target.value)} placeholder="매수 이유, 목표가, 전략 등..."/></div>
        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={onClose} style={{flex:1,padding:13,borderRadius:12,background:SUR2,border:`1px solid ${BOR}`,color:TEXT,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>취소</button>
          <button onClick={()=>name&&buy&&onSave({name:name.trim(),buyPrice:parseFloat(buy),qty:parseFloat(qty)||0,sector:finalSector,ticker:ticker.trim(),memo:memo.trim()})} style={{flex:2,padding:13,borderRadius:12,background:ACC,border:"none",color:"#fff",fontSize:15,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>{stock?"저장하기":"추가하기"}</button>
        </div>
      </div>
    </div>
  );
}

function StockList({stocks,accId,onReorderStocks,onEditStock,onDeleteStock,confirmDel,setConfirmDel}){
  const drag=useDrag(stocks,onReorderStocks);
  return(
    <>
      {stocks.map((s,si)=>{
        const db=drag(si);
        const rate=s.currentPrice&&s.buyPrice?(s.currentPrice-s.buyPrice)/s.buyPrice*100:null;
        const asset=s.currentPrice&&s.qty?s.currentPrice*s.qty:null;
        return(
          <div key={s.id} {...db} style={{...db.style,padding:"12px 16px",borderBottom:`1px solid rgba(36,40,54,.5)`,display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:500,color:TEXT,marginBottom:2}}>{s.name}</div>
              <div style={{fontSize:11,color:MUTED,fontFamily:"monospace",display:"flex",gap:6,flexWrap:"wrap"}}>
                <span>매수 {Number(s.buyPrice).toLocaleString()}</span>
                {s.qty>0&&<span>{s.qty}주</span>}
                {s.ticker&&<span style={{color:ACC}}>{s.ticker}</span>}
              </div>
              {asset!=null&&<div style={{fontSize:11,color:ACC,fontFamily:"monospace",marginTop:1}}>평가 {asset.toLocaleString(undefined,{maximumFractionDigits:0})} {s.currency}</div>}
              {s.memo&&<div style={{fontSize:11,color:"#4a5470",marginTop:3,lineHeight:1.5,whiteSpace:"pre-wrap"}}>📝 {s.memo}</div>}
            </div>
            <div style={{textAlign:"right",flexShrink:0,marginRight:8}}>
              {s.currentPrice?<div style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:TEXT,marginBottom:3}}>{s.currentPrice.toLocaleString(undefined,{maximumFractionDigits:2})} <span style={{fontSize:10,color:MUTED}}>{s.currency}</span></div>:<div style={{fontSize:12,color:MUTED,marginBottom:3}}>조회 전</div>}
              {rate!=null?<span style={{fontSize:12,fontFamily:"monospace",fontWeight:700,padding:"2px 7px",borderRadius:5,background:rate>0?"rgba(38,192,106,.15)":"rgba(240,64,96,.15)",color:rate>0?UP:DOWN}}>{rate>0?"+":""}{rate.toFixed(2)}%</span>:<span style={{fontSize:12,padding:"2px 7px",borderRadius:5,background:SUR2,color:MUTED}}>—</span>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {confirmDel?.sid===s.id?(
                <><button onClick={()=>onDeleteStock(s.id)} style={{padding:"3px 8px",borderRadius:7,border:"none",background:DOWN,color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700}}>삭제</button><button onClick={()=>setConfirmDel(null)} style={{padding:"3px 8px",borderRadius:7,border:`1px solid ${BOR}`,background:SUR2,color:MUTED,cursor:"pointer",fontSize:11}}>취소</button></>
              ):(
                <><button onClick={e=>{e.stopPropagation();onEditStock(s);}} style={{width:26,height:26,borderRadius:7,border:`1px solid ${BOR}`,background:SUR2,color:MUTED,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✎</button><button onClick={e=>{e.stopPropagation();setConfirmDel({sid:s.id});}} style={{width:26,height:26,borderRadius:7,border:"1px solid rgba(240,64,96,.4)",background:"rgba(240,64,96,.1)",color:DOWN,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function OCRModal({accounts,onClose,onImport}){
  const[step,setStep]=useState("upload");
  const[imgBase64,setImgBase64]=useState(null);
  const[imgMediaType,setImgMediaType]=useState("image/jpeg");
  const[imgPreview,setImgPreview]=useState(null);
  const[loading,setLoading]=useState(false);
  const[parsed,setParsed]=useState([]);
  const[error,setError]=useState("");
  const[targetAcc,setTargetAcc]=useState(accounts[0]?.id||"");
  const fileRef=React.useRef();

  function onFile(e){
    const file=e.target.files[0];
    if(!file)return;
    const mt=file.type||"image/jpeg";
    setImgMediaType(mt);
    const reader=new FileReader();
    reader.onload=ev=>{
      const b64=ev.target.result.split(",")[1];
      setImgBase64(b64);
      setImgPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function analyze(){
    if(!imgBase64){setError("이미지를 먼저 선택해주세요.");return;}
    setLoading(true);setError("");
    try{
      const res=await fetch("/api/ocr",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({imageBase64:imgBase64,mediaType:imgMediaType})
      });
      const d=await res.json();
      if(d.error)throw new Error(d.error);
      const stocks=d.stocks||[];
      if(stocks.length===0)throw new Error("종목을 찾지 못했어요. 보유종목 화면을 캡처해주세요.");
      setParsed(stocks);
      setStep("confirm");
    }catch(e){
      setError("분석 실패: "+e.message);
    }
    setLoading(false);
  }

  function updateStock(i,field,val){
    setParsed(prev=>prev.map((s,idx)=>idx===i?{...s,[field]:val}:s));
  }
  function removeStock(i){setParsed(prev=>prev.filter((_,idx)=>idx!==i));}

  const inp={background:BG,border:`1px solid ${BOR}`,borderRadius:8,color:TEXT,fontSize:13,padding:"7px 10px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"};

  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:500}}>
      <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",padding:"22px 20px 44px"}}>

        {step==="upload"&&(
          <>
            <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>📷 캡처로 종목 입력</div>
            <div style={{fontSize:13,color:MUTED,marginBottom:20,lineHeight:1.6}}>증권사 앱의 보유종목 화면을 캡처해서 올리면<br/>AI가 자동으로 종목 정보를 읽어줘요</div>
            <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${imgPreview?ACC:BOR}`,borderRadius:14,padding:"24px",textAlign:"center",cursor:"pointer",marginBottom:14,background:imgPreview?"rgba(79,142,247,.05)":SUR2}}>
              {imgPreview?(
                <img src={imgPreview} style={{maxWidth:"100%",maxHeight:300,borderRadius:8,objectFit:"contain"}} alt="preview"/>
              ):(
                <>
                  <div style={{fontSize:36,marginBottom:8}}>📂</div>
                  <div style={{fontSize:14,color:MUTED}}>클릭해서 이미지 선택</div>
                  <div style={{fontSize:11,color:MUTED,marginTop:4}}>JPG, PNG 지원</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display:"none"}}/>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:MUTED,marginBottom:5}}>추가할 계좌</div>
              <select value={targetAcc} onChange={e=>setTargetAcc(e.target.value)} style={{...inp,width:"100%",padding:"10px 12px",fontSize:14}}>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            {error&&<div style={{color:DOWN,fontSize:13,padding:"10px 14px",background:"rgba(240,64,96,.1)",borderRadius:10,marginBottom:12}}>{error}</div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={onClose} style={{flex:1,padding:13,borderRadius:12,background:SUR2,border:`1px solid ${BOR}`,color:TEXT,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>취소</button>
              <button onClick={analyze} disabled={loading||!imgBase64} style={{flex:2,padding:13,borderRadius:12,background:"#8b5cf6",border:"none",color:"#fff",fontSize:14,cursor:"pointer",fontWeight:600,fontFamily:"inherit",opacity:loading||!imgBase64?0.5:1}}>
                {loading?"AI 분석 중...":"🤖 자동 분석"}
              </button>
            </div>
          </>
        )}

        {step==="confirm"&&(
          <>
            <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>✅ 인식된 종목 확인</div>
            <div style={{fontSize:13,color:MUTED,marginBottom:16}}>{parsed.length}개 종목 · 수정 후 추가하세요</div>
            {parsed.map((s,i)=>(
              <div key={i} style={{background:SUR2,border:`1px solid ${BOR}`,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <input value={s.name||""} onChange={e=>updateStock(i,"name",e.target.value)} style={{...inp,flex:1,fontSize:14,fontWeight:600,marginRight:8}} placeholder="종목명"/>
                  <button onClick={()=>removeStock(i)} style={{width:24,height:24,borderRadius:"50%",border:"none",background:"rgba(240,64,96,.2)",color:DOWN,cursor:"pointer",fontSize:12,flexShrink:0}}>✕</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div>
                    <div style={{fontSize:10,color:MUTED,marginBottom:3}}>매수 평균가</div>
                    <input value={s.buyPrice||""} onChange={e=>updateStock(i,"buyPrice",parseFloat(e.target.value)||0)} type="number" style={{...inp,width:"100%"}} placeholder="0"/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:MUTED,marginBottom:3}}>보유 수량</div>
                    <input value={s.qty||""} onChange={e=>updateStock(i,"qty",parseFloat(e.target.value)||0)} type="number" style={{...inp,width:"100%"}} placeholder="0"/>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div>
                    <div style={{fontSize:10,color:MUTED,marginBottom:3}}>티커</div>
                    <input value={s.ticker||""} onChange={e=>updateStock(i,"ticker",e.target.value)} style={{...inp,width:"100%"}} placeholder="005930.KS"/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:MUTED,marginBottom:3}}>섹터</div>
                    <input value={s.sector||""} onChange={e=>updateStock(i,"sector",e.target.value)} style={{...inp,width:"100%"}} placeholder="반도체"/>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={()=>setStep("upload")} style={{width:"100%",padding:"10px",borderRadius:10,background:SUR2,border:`1px solid ${BOR}`,color:MUTED,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>← 다시 촬영</button>
            <button onClick={()=>onImport(targetAcc,parsed.filter(s=>s.name&&s.buyPrice))} style={{width:"100%",padding:14,borderRadius:12,background:"#8b5cf6",border:"none",color:"#fff",fontSize:15,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
              {parsed.filter(s=>s.name&&s.buyPrice).length}개 종목 추가하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AccountsTab({accounts,setAccounts,usdKrw,onRefresh,loading}){
  const[showAdd,setShowAdd]=useState(false);
  const[showOCR,setShowOCR]=useState(false);
  const[newName,setNewName]=useState("");
  const[expanded,setExpanded]=useState(null);
  const[stockModal,setStockModal]=useState(null);
  const[confirmDel,setConfirmDel]=useState(null);
  const[editAccId,setEditAccId]=useState(null);
  const[editAccName,setEditAccName]=useState("");
  const[toast,setToast]=useState("");
  function showToast(m){setToast(m);setTimeout(()=>setToast(""),2500);}
  const toKrw=(v,c)=>c==="USD"?v*usdKrw:v;
  const customSectors=[...new Set(accounts.flatMap(a=>(a.stocks||[]).map(s=>s.sector)).filter(s=>s&&!DEFAULT_SECTORS.includes(s)))];
  const accDrag=useDrag(accounts,setAccounts);

  function addAcc(){if(!newName.trim())return;setAccounts([...accounts,{id:makeId(),name:newName.trim(),stocks:[]}]);setNewName("");setShowAdd(false);showToast("계좌 추가됐어요 ✓");}
  function delAcc(id){setAccounts(accounts.filter(a=>a.id!==id));setConfirmDel(null);showToast("계좌 삭제됐어요");}
  function renameAcc(id,name){if(!name.trim())return;setAccounts(accounts.map(a=>a.id===id?{...a,name:name.trim()}:a));setEditAccId(null);showToast("계좌명 수정됐어요 ✓");}

  function saveStock(accId,data,editId){
    setAccounts(accounts.map(a=>{
      if(a.id!==accId)return a;
      const stocks=editId?a.stocks.map(s=>s.id===editId?{...s,...data}:s):[...(a.stocks||[]),{id:makeId(),...data,currentPrice:null,currency:data.sector==="미국"?"USD":"KRW"}];
      return{...a,stocks};
    }));
    setStockModal(null);showToast(editId?"수정됐어요 ✓":"종목 추가됐어요 ✓");
  }

  function reorderStocks(accId,newStocks){
    setAccounts(accounts.map(a=>a.id===accId?{...a,stocks:newStocks}:a));
  }

  function deleteStock(accId,sid){
    setAccounts(accounts.map(a=>a.id!==accId?a:{...a,stocks:(a.stocks||[]).filter(s=>s.id!==sid)}));
    setConfirmDel(null);showToast("삭제됐어요");
  }

  const inp={background:BG,border:`1px solid ${BOR}`,borderRadius:10,color:TEXT,fontSize:15,padding:"11px 14px",width:"100%",fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  const allS=accounts.flatMap(a=>a.stocks||[]);
  const tot=allS.reduce((a,s)=>s.currentPrice&&s.qty?a+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):a,0);
  const buy=allS.reduce((a,s)=>s.buyPrice&&s.qty?a+toKrw(s.buyPrice*s.qty,s.currency||"KRW"):a,0);
  const pnl=tot-buy,pr=buy>0?pnl/buy*100:0;

  return(
    <div style={{padding:"16px 16px 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{fontSize:19,fontWeight:700}}>내 계좌</span>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onRefresh} disabled={loading} style={{fontSize:12,padding:"7px 14px",borderRadius:9,background:ACC,border:"none",color:"#fff",cursor:loading?"not-allowed":"pointer",opacity:loading?0.5:1,fontFamily:"inherit"}}><span style={loading?{display:"inline-block",animation:"spin 1s linear infinite"}:{}}>↻</span>{" "}시세</button>
          <button onClick={()=>setShowOCR(true)} style={{fontSize:12,padding:"7px 14px",borderRadius:9,background:"#8b5cf6",border:"none",color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>📷 캡처입력</button>
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

      <div style={{fontSize:11,color:MUTED,marginBottom:8,paddingLeft:2}}>꾹 눌러서 계좌/종목 순서 변경 가능</div>

      {accounts.map((acc,ai)=>{
        const db=accDrag(ai);
        const stocks=acc.stocks||[];
        const aT=stocks.reduce((a,s)=>s.currentPrice&&s.qty?a+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):a,0);
        const aB=stocks.reduce((a,s)=>s.buyPrice&&s.qty?a+toKrw(s.buyPrice*s.qty,s.currency||"KRW"):a,0);
        const aPnl=aT-aB,aR=aB>0?aPnl/aB*100:0,open=expanded===acc.id,col=COLORS[ai%COLORS.length];
        return(
          <div key={acc.id} {...db} style={{...db.style,background:SUR,border:`1px solid ${BOR}`,borderRadius:16,marginBottom:12,overflow:"hidden"}}>
            <div onClick={()=>setExpanded(open?null:acc.id)} style={{padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:col,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                {editAccId===acc.id?(
                  <div onClick={e=>e.stopPropagation()} style={{display:"flex",gap:6}}>
                    <input value={editAccName} onChange={e=>setEditAccName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&renameAcc(acc.id,editAccName)} style={{flex:1,background:BG,border:`1px solid ${ACC}`,borderRadius:8,color:TEXT,fontSize:14,padding:"4px 8px",fontFamily:"inherit",outline:"none"}} autoFocus/>
                    <button onClick={()=>renameAcc(acc.id,editAccName)} style={{padding:"4px 10px",borderRadius:8,border:"none",background:ACC,color:"#fff",cursor:"pointer",fontSize:12}}>✓</button>
                    <button onClick={()=>setEditAccId(null)} style={{padding:"4px 8px",borderRadius:8,border:`1px solid ${BOR}`,background:SUR2,color:MUTED,cursor:"pointer",fontSize:12}}>✕</button>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{fontSize:16,fontWeight:600,color:TEXT}}>{acc.name}</div>
                    <button onClick={e=>{e.stopPropagation();setEditAccId(acc.id);setEditAccName(acc.name);}} style={{width:20,height:20,borderRadius:5,border:`1px solid ${BOR}`,background:"transparent",color:MUTED,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>✎</button>
                  </div>
                )}
                <div style={{fontSize:11,color:MUTED,marginTop:2}}>{stocks.length}종목</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:16,fontFamily:"monospace",fontWeight:700,color:TEXT}}>{aT>0?"₩"+Math.round(aT).toLocaleString():"—"}</div>
                {aT>0&&<div style={{fontSize:12,color:aPnl>=0?UP:DOWN}}>{aPnl>=0?"+":""}{aR.toFixed(2)}%</div>}
              </div>
              <span style={{color:MUTED,fontSize:14,marginLeft:4}}>{open?"▲":"▼"}</span>
            </div>

            {open&&(
              <div style={{borderTop:`1px solid ${BOR}`}}>
                <StockList
                  stocks={stocks}
                  accId={acc.id}
                  onReorderStocks={(ns)=>reorderStocks(acc.id,ns)}
                  onEditStock={(s)=>setStockModal({accId:acc.id,stock:s})}
                  onDeleteStock={(sid)=>deleteStock(acc.id,sid)}
                  confirmDel={confirmDel}
                  setConfirmDel={setConfirmDel}
                />
                <div style={{padding:"12px 16px",display:"flex",gap:8}}>
                  <button onClick={()=>setStockModal({accId:acc.id})} style={{flex:1,padding:"10px",borderRadius:10,background:ACC,border:"none",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>+ 종목 추가</button>
                  {confirmDel?.aid===acc.id?(
                    <><button onClick={()=>delAcc(acc.id)} style={{padding:"10px 14px",borderRadius:10,border:"none",background:DOWN,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>삭제확인</button><button onClick={()=>setConfirmDel(null)} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${BOR}`,background:SUR2,color:MUTED,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>취소</button></>
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
      {stockModal&&<StockModal stock={stockModal.stock} onClose={()=>setStockModal(null)} onSave={data=>saveStock(stockModal.accId,data,stockModal.stock?.id)} customSectors={customSectors}/>}
      {showOCR&&<OCRModal accounts={accounts} onClose={()=>setShowOCR(false)} onImport={(accId,stocks)=>{
        setAccounts(accounts.map(a=>{
          if(a.id!==accId)return a;
          const newStocks=stocks.map(s=>({id:makeId(),...s,currentPrice:null,currency:s.sector==="미국"?"USD":"KRW"}));
          return{...a,stocks:[...(a.stocks||[]),...newStocks]};
        }));
        setShowOCR(false);
        showToast(`${stocks.length}개 종목이 추가됐어요 ✓`);
      }}/>}
      <Toast msg={toast}/>
    </div>
  );
}

const NYSE_TICKERS=new Set(["TSM","BRK.A","BRK.B","JPM","BAC","XOM","CVX","JNJ","PG","KO","PEP","WMT","V","MA","UNH","HD","MRK","ABBV","PFE","LLY","TMO","ABT","DHR","BMY","AMGN","COST","NEE","ACN","TXN","NKE","PM","RTX","HON","IBM","CAT","GE","MMM","MCD","WFC","C","GS","MS","AXP","BLK","SCHW","USB","PNC","TFC","COF","AIG","MET","PRU","ALL","TRV","AFL","PL"]);
function toTVSymbol(ticker){
  if(!ticker)return null;
  if(ticker.endsWith(".KS"))return"KRX:"+ticker.replace(".KS","");
  if(ticker.endsWith(".KQ"))return"KOSDAQ:"+ticker.replace(".KQ","");
  if(NYSE_TICKERS.has(ticker.toUpperCase()))return"NYSE:"+ticker.toUpperCase();
  return"NASDAQ:"+ticker.toUpperCase();
}

function ChartCard({stock}){
  const ref=React.useRef(null);
  const symbol=toTVSymbol(stock.ticker);
  const rate=stock.currentPrice&&stock.buyPrice?(stock.currentPrice-stock.buyPrice)/stock.buyPrice*100:null;

  React.useEffect(()=>{
    if(!ref.current||!symbol)return;
    ref.current.innerHTML="";
    const script=document.createElement("script");
    script.src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async=true;
    script.innerHTML=JSON.stringify({
      symbol,width:"100%",height:220,locale:"kr",dateRange:"3M",colorTheme:"dark",isTransparent:true,autosize:true,largeChartUrl:"",noTimeScale:false,
    });
    ref.current.appendChild(script);
  },[symbol]);

  if(!symbol)return null;

  return(
    <div style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:14,overflow:"hidden",marginBottom:12}}>
      <div style={{padding:"12px 14px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <span style={{fontSize:15,fontWeight:600,color:TEXT}}>{stock.name}</span>
          <span style={{fontSize:11,color:MUTED,marginLeft:8,fontFamily:"monospace"}}>{stock.ticker}</span>
        </div>
        <div style={{textAlign:"right"}}>
          {stock.currentPrice&&<div style={{fontSize:14,fontFamily:"monospace",fontWeight:700,color:TEXT}}>{stock.currentPrice.toLocaleString(undefined,{maximumFractionDigits:2})} <span style={{fontSize:10,color:MUTED}}>{stock.currency}</span></div>}
          {rate!=null&&<span style={{fontSize:12,fontFamily:"monospace",fontWeight:700,padding:"1px 7px",borderRadius:5,background:rate>0?"rgba(38,192,106,.15)":"rgba(240,64,96,.15)",color:rate>0?UP:DOWN}}>{rate>0?"+":""}{rate.toFixed(2)}%</span>}
        </div>
      </div>
      <div style={{padding:"0 4px 4px"}}>
        <div className="tradingview-widget-container" ref={ref} style={{height:220}}/>
      </div>
    </div>
  );
}

function ChartTab({accounts}){
  const allStocks=accounts.flatMap(a=>a.stocks||[]).filter(s=>s.ticker);
  const[order,setOrder]=useState(()=>allStocks.map((_,i)=>i));
  const[toast,setToast]=useState("");
  function showToast(m){setToast(m);setTimeout(()=>setToast(""),2000);}

  React.useEffect(()=>{
    setOrder(allStocks.map((_,i)=>i));
  },[allStocks.length]);

  const sortedStocks=order.map(i=>allStocks[i]).filter(Boolean);
  const drag=useDrag(sortedStocks,(ns)=>{
    const newOrder=ns.map(s=>allStocks.findIndex(a=>a.ticker===s.ticker));
    setOrder(newOrder);
    showToast("순서 변경됐어요 ✓");
  });

  if(allStocks.length===0)return(
    <div style={{padding:"60px 20px",textAlign:"center",color:MUTED}}>
      <div style={{fontSize:40,marginBottom:12}}>📊</div>
      <p style={{fontSize:14,lineHeight:1.8}}>계좌 탭에서 티커를 입력한 종목만<br/>차트가 표시돼요</p>
    </div>
  );

  return(
    <div style={{padding:"16px 16px 40px"}}>
      <div style={{fontSize:11,color:MUTED,marginBottom:12,paddingLeft:2}}>꾹 눌러서 차트 순서 변경 가능</div>
      {sortedStocks.map((s,i)=>{
        const db=drag(i);
        return(
          <div key={s.ticker} {...db} style={{...db.style,marginBottom:12,borderRadius:14,overflow:"hidden"}}>
            <ChartCard stock={s}/>
          </div>
        );
      })}
      <Toast msg={toast}/>
    </div>
  );
}

function AdminTab(){
  const[users,setUsers]=useState([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const[confirmDel,setConfirmDel]=useState(null);
  const[toast,setToast]=useState("");
  function showToast(m){setToast(m);setTimeout(()=>setToast(""),2500);}
  function loadUsers(){
    setLoading(true);setError("");
    fetch("/api/admin").then(r=>r.json()).then(d=>{
      if(d.users){setUsers(d.users);}
      else if(d.error){setError(d.error);}
      setLoading(false);
    }).catch(e=>{setError(e.message);setLoading(false);});
  }
  useEffect(()=>{loadUsers();},[]);
  async function kickUser(userId){
    await fetch("/api/admin",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId})});
    setUsers(users.filter(u=>u.userId!==userId));setConfirmDel(null);showToast("유저 데이터를 삭제했어요");
  }
  return(
    <div style={{padding:"16px 16px 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:19,fontWeight:700}}>⚙ 관리자</div>
          <div style={{fontSize:12,color:MUTED,marginTop:2}}>총 <b style={{color:TEXT}}>{users.length}</b>명 가입</div>
        </div>
        <button onClick={loadUsers} style={{fontSize:12,padding:"6px 12px",borderRadius:8,background:SUR2,border:`1px solid ${BOR}`,color:TEXT,cursor:"pointer",fontFamily:"inherit"}}>↻ 새로고침</button>
      </div>
      {error&&<div style={{color:DOWN,fontSize:13,padding:"10px 14px",background:"rgba(240,64,96,.1)",borderRadius:10,marginBottom:12}}>{error}</div>}
      {loading&&<div style={{color:MUTED,textAlign:"center",padding:40}}>불러오는 중...</div>}
      {users.map(u=>(
        <div key={u.userId} style={{background:SUR,border:`1px solid ${BOR}`,borderRadius:14,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:TEXT,marginBottom:4,wordBreak:"break-all"}}>{u.userId}</div>
              <div style={{fontSize:11,color:MUTED,display:"flex",gap:10}}><span>계좌 {u.accountCount}개</span><span>종목 {u.stockCount}개</span><span>기록 {u.historyCount}회</span></div>
              {u.updatedAt&&<div style={{fontSize:10,color:MUTED,marginTop:3}}>{new Date(u.updatedAt).toLocaleDateString("ko-KR")}</div>}
            </div>
            <div style={{flexShrink:0}}>
              {confirmDel===u.userId?(
                <div style={{display:"flex",gap:6}}><button onClick={()=>kickUser(u.userId)} style={{padding:"6px 12px",borderRadius:8,border:"none",background:DOWN,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700}}>강퇴확인</button><button onClick={()=>setConfirmDel(null)} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${BOR}`,background:SUR2,color:MUTED,cursor:"pointer",fontSize:12}}>취소</button></div>
              ):(
                <button onClick={()=>setConfirmDel(u.userId)} style={{padding:"6px 12px",borderRadius:8,border:"1px solid rgba(240,64,96,.3)",background:"transparent",color:DOWN,cursor:"pointer",fontSize:12}}>강퇴</button>
              )}
            </div>
          </div>
        </div>
      ))}
      {!loading&&!error&&users.length===0&&<div style={{textAlign:"center",padding:40,color:MUTED}}>아직 가입된 유저가 없어요</div>}
      <Toast msg={toast}/>
    </div>
  );
}

export default function App(){
  const{data:session,status}=useSession();
  const[tab,setTab]=useState("dash");
  const[accounts,setAccountsRaw]=useState([]);
  const[history,setHistory]=useState([]);
  const[usdKrw,setUsdKrw]=useState(1450);
  const[loading,setLoading]=useState(false);
  const[syncing,setSyncing]=useState(false);
  const[updated,setUpdated]=useState("");
  const[toast,setToast]=useState("");
  const saveTimer=useRef(null);
  const historyRef=useRef([]);
  const accountsRef=useRef([]);

  function showToast(m){setToast(m);setTimeout(()=>setToast(""),3000);}

  useEffect(()=>{
    if(status==="authenticated"){
      fetch("/api/portfolio").then(r=>r.json()).then(d=>{
        if(d.accounts){setAccountsRaw(d.accounts);accountsRef.current=d.accounts;}
        if(d.history){setHistory(d.history);historyRef.current=d.history;}
      });
    }
  },[status]);

  function setAccounts(val){
    setAccountsRaw(val);
    accountsRef.current=val;
    clearTimeout(saveTimer.current);
    setSyncing(true);
    saveTimer.current=setTimeout(async()=>{
      try{
        await fetch("/api/portfolio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accounts:val,history:historyRef.current})});
      }catch(e){console.error("save failed",e);}
      setSyncing(false);
    },800);
  }

  async function saveHistory(newH){
    setHistory(newH);
    historyRef.current=newH;
    await fetch("/api/portfolio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accounts:accountsRef.current,history:newH})});
  }

  const refresh=useCallback(async()=>{
    if(loading)return;setLoading(true);
    try{
      const allS=accountsRef.current.flatMap(a=>a.stocks||[]);
      const result=await fetch("/api/prices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tickers:allS.filter(s=>s.ticker).map(s=>({ticker:s.ticker,isKR:s.ticker.includes(".K")})),fetchRate:true})}).then(r=>r.json());
      const prices=result.prices||[],rate=result.usdKrw||1450;
      setUsdKrw(rate);
      const toKrw=(v,c)=>c==="USD"?v*rate:v;
      const updAcc=accountsRef.current.map(a=>({...a,stocks:(a.stocks||[]).map(s=>{const p=prices.find(p=>p.ticker===s.ticker);return p?.price?{...s,currentPrice:p.price,currency:p.currency||s.currency}:s;})}));
      setAccountsRaw(updAcc);
      accountsRef.current=updAcc;
      const total=updAcc.flatMap(a=>a.stocks||[]).reduce((a,s)=>s.currentPrice&&s.qty?a+toKrw(s.currentPrice*s.qty,s.currency||"KRW"):a,0);
      if(total>0){
        const today=new Date().toLocaleDateString("ko-KR",{month:"numeric",day:"numeric"});
        const newH=[...historyRef.current.filter(h=>h.date!==today),{date:today,total:Math.round(total)}].slice(-60);
        await saveHistory(newH);
      }
      await fetch("/api/portfolio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accounts:updAcc,history:historyRef.current})});
      const now=new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});
      setUpdated(now);
      const failed=prices.filter(p=>!p.price).map(p=>p.ticker);
      showToast(failed.length?`완료 — 실패: ${failed.join(", ")}`:`시세 업데이트 완료 ✓ (₩${rate.toLocaleString()})`);
    }catch(e){showToast("⚠ "+e.message.slice(0,50));}
    setLoading(false);
  },[loading]);

  if(status==="loading")return<div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:MUTED,fontFamily:"'Noto Sans KR',sans-serif",fontSize:15}}>로딩 중...</div>;
  if(status==="unauthenticated")return<LoginScreen/>;

  return(
    <>
      <Head>
        <title>MyStock</title>
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&display=swap" rel="stylesheet"/>
      </Head>
      <div style={{background:BG,minHeight:"100vh",color:TEXT,fontFamily:"'Noto Sans KR',sans-serif"}}>
        <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{background:${BG};}@keyframes spin{to{transform:rotate(360deg);}}select option{background:${SUR2};}`}</style>
        <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(10,12,16,.98)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${BOR}`}}>
          <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span onClick={()=>setTab("dash")} style={{fontSize:18,fontWeight:800,cursor:"pointer"}}>My<span style={{color:ACC}}>Stock</span></span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {syncing&&<span style={{fontSize:11,color:MUTED}}>저장 중...</span>}
              {session.user.isAdmin&&(
                <button onClick={()=>setTab(tab==="admin"?"dash":"admin")} style={{fontSize:11,padding:"4px 9px",borderRadius:7,background:tab==="admin"?"rgba(79,142,247,.2)":SUR2,border:`1px solid ${tab==="admin"?ACC:BOR}`,color:tab==="admin"?ACC:MUTED,cursor:"pointer",fontFamily:"inherit"}}>⚙ 관리</button>
              )}
              <span style={{fontSize:12,color:MUTED,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.user.name||session.user.email}</span>
              <button onClick={()=>signOut()} style={{fontSize:11,padding:"4px 9px",borderRadius:7,background:SUR2,border:`1px solid ${BOR}`,color:MUTED,cursor:"pointer",fontFamily:"inherit"}}>로그아웃</button>
            </div>
          </div>
          {tab!=="admin"&&<TabBar tab={tab} setTab={setTab}/>}
        </div>
        {tab==="dash"&&<DashTab accounts={accounts} usdKrw={usdKrw} setUsdKrw={setUsdKrw} onRefresh={refresh} loading={loading} updated={updated}/>}
        {tab==="history"&&<HistoryTab history={history} accounts={accounts} usdKrw={usdKrw}/>}
        {tab==="chart"&&<ChartTab accounts={accounts}/>}
        {tab==="accounts"&&<AccountsTab accounts={accounts} setAccounts={setAccounts} usdKrw={usdKrw} onRefresh={refresh} loading={loading}/>}
        {tab==="admin"&&session.user.isAdmin&&<AdminTab/>}
        <Toast msg={toast}/>
      </div>
    </>
  );
}
