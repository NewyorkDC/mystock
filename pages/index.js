import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

const SECTOR_COLORS = {
  건설: "#f59e0b", 배터리: "#10b981", 반도체: "#3b82f6",
  통신: "#8b5cf6", 바이오: "#ec4899", 금융: "#f97316",
  IT: "#06b6d4", 미국: "#4f8ef7", 기타: "#6b7280",
};
const SECTORS = Object.keys(SECTOR_COLORS);

const DEFAULT_STOCKS = [
  { name: "대우건설",  buyPrice: 12210,   qty: 100, sector: "건설",  ticker: "047040.KS" },
  { name: "비츠로셀",  buyPrice: 38500,   qty: 50,  sector: "배터리", ticker: "082920.KQ" },
  { name: "삼성SDI",   buyPrice: 481500,  qty: 10,  sector: "배터리", ticker: "006400.KS" },
  { name: "대덕전자",  buyPrice: 74600,   qty: 30,  sector: "반도체", ticker: "008060.KS" },
  { name: "삼성전기",  buyPrice: 514000,  qty: 5,   sector: "반도체", ticker: "009150.KS" },
  { name: "TSMC",      buyPrice: 193.027, qty: 10,  sector: "미국",   ticker: "TSM" },
];

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// ── 시세 조회 (서버 API 경유)
async function fetchAllPrices(stocks) {
  const tickers = stocks
    .filter((s) => s.ticker)
    .map((s) => ({ ticker: s.ticker, isKR: s.ticker.includes(".K") }));
  if (!tickers.length) return [];

  const res = await fetch("/api/prices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickers }),
  });
  if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
  const data = await res.json();
  return data.prices;
}

// ── Toast
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)",
      background: "#1e2330", border: "1px solid #2a2f3e", color: "#e8ecf4",
      padding: "9px 20px", borderRadius: 20, fontSize: 13, zIndex: 500,
      pointerEvents: "none", whiteSpace: "nowrap", maxWidth: "90vw",
      overflow: "hidden", textOverflow: "ellipsis",
    }}>{msg}</div>
  );
}

// ── 종목 행
function StockRow({ stock, confirming, onEdit, onRequestDelete, onConfirmDelete, onCancelDelete }) {
  const rate =
    stock.currentPrice && stock.buyPrice
      ? ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100
      : null;
  const asset =
    stock.currentPrice && stock.qty ? stock.currentPrice * stock.qty : null;

  return (
    <div style={{ display: "flex", alignItems: "center", padding: "13px 0", borderBottom: "1px solid rgba(42,47,62,.45)", gap: 6 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{stock.name}</div>
        <div style={{ fontSize: 10, color: "#6b7594", fontFamily: "monospace", display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span>매수 {Number(stock.buyPrice).toLocaleString()}</span>
          {stock.qty > 0 && <span>{stock.qty}주</span>}
          {stock.ticker ? (
            <span style={{ color: "#4f8ef7" }}>{stock.ticker}</span>
          ) : (
            <span style={{ color: "#f04060" }}>티커없음</span>
          )}
        </div>
        {asset != null && (
          <div style={{ fontSize: 10, color: "#4f8ef7", fontFamily: "monospace", marginTop: 1 }}>
            평가 {asset.toLocaleString(undefined, { maximumFractionDigits: 0 })} {stock.currency}
          </div>
        )}
        {stock.fetchError && (
          <div style={{ fontSize: 10, color: "#f04060" }}>⚠ {stock.fetchError}</div>
        )}
      </div>

      <div style={{ textAlign: "right", flexShrink: 0, marginRight: 6 }}>
        {stock.currentPrice ? (
          <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 600, marginBottom: 3 }}>
            {stock.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span style={{ fontSize: 10, color: "#6b7594", marginLeft: 3 }}>{stock.currency}</span>
          </div>
        ) : (
          <div style={{ color: "#6b7594", fontSize: 11, marginBottom: 3 }}>조회 전</div>
        )}
        {rate !== null ? (
          <span style={{
            fontFamily: "monospace", fontSize: 12, fontWeight: 600,
            padding: "2px 8px", borderRadius: 5,
            background: rate > 0 ? "rgba(38,192,106,.15)" : rate < 0 ? "rgba(240,64,96,.15)" : "#1e2330",
            color: rate > 0 ? "#26c06a" : rate < 0 ? "#f04060" : "#6b7594",
          }}>
            {rate > 0 ? "+" : ""}{rate.toFixed(2)}%
          </span>
        ) : (
          <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 5, background: "#1e2330", color: "#6b7594" }}>—</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        {confirming ? (
          <>
            <button onClick={onConfirmDelete} style={{ padding: "3px 8px", borderRadius: 7, border: "none", background: "#f04060", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>삭제</button>
            <button onClick={onCancelDelete} style={{ padding: "3px 8px", borderRadius: 7, border: "1px solid #2a2f3e", background: "#1e2330", color: "#6b7594", cursor: "pointer", fontSize: 11 }}>취소</button>
          </>
        ) : (
          <>
            <button onClick={onEdit} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #2a2f3e", background: "#1e2330", color: "#6b7594", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✎</button>
            <button onClick={onRequestDelete} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(240,64,96,.4)", background: "rgba(240,64,96,.1)", color: "#f04060", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── 종목 추가/수정 모달
function StockModal({ mode, stock, onClose, onSave }) {
  const [name, setName]       = useState(stock?.name || "");
  const [buy, setBuy]         = useState(stock?.buyPrice || "");
  const [qty, setQty]         = useState(stock?.qty || "");
  const [sector, setSector]   = useState(stock?.sector || "건설");
  const [ticker, setTicker]   = useState(stock?.ticker || "");

  const inp = {
    background: "#0d0f14", border: "1px solid #2a2f3e", borderRadius: 10,
    color: "#e8ecf4", fontSize: 15, padding: "11px 14px", width: "100%",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300,
    }}>
      <div style={{ background: "#161920", border: "1px solid #2a2f3e", borderRadius: "20px 20px 0 0", padding: "22px 20px 40px", width: "100%", maxWidth: 520 }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
          {mode === "add" ? "종목 추가" : "종목 수정"}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#6b7594", marginBottom: 6 }}>종목명</div>
          <input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 삼성전자, TSMC" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#6b7594", marginBottom: 6 }}>매수 평균가</div>
            <input style={inp} type="number" value={buy} onChange={(e) => setBuy(e.target.value)} placeholder="0" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#6b7594", marginBottom: 6 }}>보유 수량</div>
            <input style={inp} type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" step="any" />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#6b7594", marginBottom: 6 }}>섹터</div>
          <select style={inp} value={sector} onChange={(e) => setSector(e.target.value)}>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: "#6b7594", marginBottom: 6 }}>티커 심볼</div>
          <input style={inp} value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="미국: TSM · 한국: 005930.KS" />
          <div style={{ fontSize: 10, color: "#6b7594", marginTop: 5, lineHeight: 1.7 }}>
            🇰🇷 코스피: 종목코드.KS &nbsp;·&nbsp; 코스닥: 종목코드.KQ<br />
            🇺🇸 미국: TSM · AAPL · NVDA · MSFT 등
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#1e2330", border: "1px solid #2a2f3e", color: "#e8ecf4", fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          <button
            onClick={() => name && buy && onSave({ name: name.trim(), buyPrice: parseFloat(buy), qty: parseFloat(qty) || 0, sector, ticker: ticker.trim() })}
            style={{ flex: 2, padding: 13, borderRadius: 12, background: "#4f8ef7", border: "none", color: "#fff", fontSize: 15, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}
          >
            {mode === "add" ? "추가하기" : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인
export default function Home() {
  const [stocks, setStocks] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = JSON.parse(localStorage.getItem("myStocks") || "[]");
      if (saved.length) return saved.map((s) => ({ qty: 0, currentPrice: null, ...s }));
    } catch {}
    return DEFAULT_STOCKS.map((s) => ({
      id: makeId(), ...s, currentPrice: null,
      currency: s.sector === "미국" ? "USD" : "KRW",
    }));
  });

  const [loading, setLoading]     = useState(false);
  const [updated, setUpdated]     = useState("");
  const [toast, setToast]         = useState("");
  const [modal, setModal]         = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const USD_KRW = 1400;

  useEffect(() => {
    if (stocks.length) localStorage.setItem("myStocks", JSON.stringify(stocks));
  }, [stocks]);

  function showToast(msg, ms = 3500) {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  }

  function resetToDefaults() {
    const fresh = DEFAULT_STOCKS.map((s) => ({
      id: makeId(), ...s, currentPrice: null,
      currency: s.sector === "미국" ? "USD" : "KRW",
    }));
    setStocks(fresh);
    showToast("기본 6종목으로 초기화됐어요 ✓");
  }

  const refresh = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const prices = await fetchAllPrices(stocks);
      setStocks((prev) =>
        prev.map((s) => {
          const p = prices.find((p) => p.ticker === s.ticker);
          if (p?.price) return { ...s, currentPrice: p.price, currency: p.currency, fetchError: null };
          if (p?.error) return { ...s, fetchError: p.error };
          return s;
        })
      );
      const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
      setUpdated(now);
      const failed = prices.filter((p) => !p.price).map((p) => p.ticker);
      showToast(failed.length ? `완료 — 실패: ${failed.join(", ")}` : "시세 업데이트 완료 ✓");
    } catch (e) {
      showToast("⚠ " + e.message.slice(0, 60));
    }
    setLoading(false);
  }, [stocks, loading]);

  function addStock(data) {
    setStocks((prev) => [...prev, { id: makeId(), ...data, currentPrice: null, currency: data.sector === "미국" ? "USD" : "KRW", fetchError: null }]);
    setModal(null);
    showToast("추가됐어요 ✓");
  }
  function editStock(id, data) {
    setStocks((prev) => prev.map((s) => s.id === id ? { ...s, ...data, fetchError: null, currentPrice: null } : s));
    setModal(null);
    showToast("수정됐어요 ✓");
  }
  function deleteStock(id) {
    setStocks((prev) => prev.filter((s) => s.id !== id));
    setConfirmId(null);
    showToast("삭제됐어요");
  }

  // 요약 계산
  const priced = stocks.filter((s) => s.currentPrice && s.buyPrice);
  const avgRate = priced.length
    ? priced.reduce((a, s) => a + ((s.currentPrice - s.buyPrice) / s.buyPrice) * 100, 0) / priced.length
    : null;
  const toKrw = (v, c) => (c === "USD" ? v * USD_KRW : v);
  const totalAsset = stocks.reduce((a, s) => s.currentPrice && s.qty ? a + toKrw(s.currentPrice * s.qty, s.currency) : a, 0);
  const totalBuy   = stocks.reduce((a, s) => s.buyPrice && s.qty    ? a + toKrw(s.buyPrice * s.qty, s.currency || "KRW") : a, 0);
  const profit = totalAsset - totalBuy;

  const groups = {};
  stocks.forEach((s) => { if (!groups[s.sector]) groups[s.sector] = []; groups[s.sector].push(s); });

  return (
    <>
      <Head>
        <title>MyStock</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ background: "#0d0f14", minHeight: "100vh", color: "#e8ecf4", fontFamily: "'Noto Sans KR', sans-serif", paddingBottom: 96 }}>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0d0f14; }
          @keyframes spin { to { transform: rotate(360deg); } }
          select option { background: #1e2330; }
        `}</style>

        {/* 헤더 */}
        <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(13,15,20,.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #2a2f3e", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-.5px" }}>
            My<span style={{ color: "#4f8ef7" }}>Stock</span>
          </span>
          <button onClick={resetToDefaults} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, background: "#1e2330", border: "1px solid #2a2f3e", color: "#6b7594", cursor: "pointer", fontFamily: "inherit" }}>
            종목 초기화
          </button>
        </div>

        {/* 요약 카드 */}
        <div style={{ padding: "16px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "#161920", border: "1px solid #2a2f3e", borderRadius: 14, padding: "13px 15px" }}>
            <div style={{ fontSize: 10, color: "#6b7594", marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 }}>보유 종목</div>
            <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 600 }}>{stocks.length}종목</div>
          </div>
          <div style={{ background: "#161920", border: "1px solid #2a2f3e", borderRadius: 14, padding: "13px 15px" }}>
            <div style={{ fontSize: 10, color: "#6b7594", marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 }}>평균 수익률</div>
            <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 600, color: avgRate == null ? "#e8ecf4" : avgRate > 0 ? "#26c06a" : "#f04060" }}>
              {avgRate != null ? (avgRate > 0 ? "+" : "") + avgRate.toFixed(2) + "%" : "—"}
            </div>
          </div>
          <div style={{ gridColumn: "span 2", background: "#161920", border: "1px solid #2a2f3e", borderRadius: 14, padding: "13px 15px" }}>
            <div style={{ fontSize: 10, color: "#6b7594", marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 }}>
              총 평가 자산 (KRW 환산 · USD×{USD_KRW.toLocaleString()})
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 600 }}>
              {totalAsset > 0 ? "₩" + totalAsset.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
            </div>
            {totalAsset > 0 && (
              <div style={{ fontSize: 12, marginTop: 4, fontFamily: "monospace", color: profit >= 0 ? "#26c06a" : "#f04060" }}>
                수익 {profit >= 0 ? "+" : "-"}₩{Math.abs(profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
          </div>
        </div>

        {/* 새로고침 바 */}
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#6b7594" }}>{updated ? "업데이트: " + updated : "시세 미조회"}</span>
          <button onClick={refresh} disabled={loading} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 9, background: "#4f8ef7", border: "none", color: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <span style={loading ? { display: "inline-block", animation: "spin 1s linear infinite" } : {}}>↻</span>
            {loading ? "조회 중..." : "실시간 시세 조회"}
          </button>
        </div>

        {/* 종목 목록 */}
        {stocks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7594" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>아직 보유 종목이 없어요.<br />+ 버튼을 눌러 추가하세요.</p>
          </div>
        ) : (
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.entries(groups).map(([sector, list]) => (
              <div key={sector}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 6px", fontSize: 12, fontWeight: 700, color: "#6b7594", borderBottom: "1px solid #2a2f3e", marginBottom: 2 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: SECTOR_COLORS[sector] || "#6b7280", flexShrink: 0 }} />
                  {sector}
                  <span style={{ fontSize: 10, background: "#1e2330", borderRadius: 20, padding: "2px 8px" }}>{list.length}</span>
                </div>
                {list.map((s) => (
                  <StockRow key={s.id} stock={s} confirming={confirmId === s.id}
                    onEdit={() => { setConfirmId(null); setModal({ mode: "edit", stock: s }); }}
                    onRequestDelete={() => setConfirmId(s.id)}
                    onConfirmDelete={() => deleteStock(s.id)}
                    onCancelDelete={() => setConfirmId(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* FAB */}
        <button onClick={() => { setConfirmId(null); setModal({ mode: "add" }); }} style={{ position: "fixed", bottom: 28, right: 20, width: 56, height: 56, borderRadius: 16, background: "#4f8ef7", color: "#fff", border: "none", fontSize: 26, cursor: "pointer", boxShadow: "0 8px 24px rgba(79,142,247,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>＋</button>

        {modal && (
          <StockModal mode={modal.mode} stock={modal.stock} onClose={() => setModal(null)}
            onSave={(data) => modal.mode === "add" ? addStock(data) : editStock(modal.stock.id, data)}
          />
        )}

        <Toast msg={toast} />
      </div>
    </>
  );
}
