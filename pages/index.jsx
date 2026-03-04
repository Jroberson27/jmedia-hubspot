import { useState, useRef } from "react";

const C = {
  charcoal: "#1E2023", charcoalMid: "#2A2D31", charcoalLt: "#35383D",
  red: "#8B1A1A", redDeep: "#3D1010", white: "#FFFFFF",
  offWhite: "#F4F4F2", muted: "#9A9A9A", border: "#3A3D42",
  inputBg: "#282B30", green: "#2D6A2D", greenLight: "#6fcf6f",
};
const FONT = { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" };
const fmt = (n) => n ? "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "—";
const durMonths = { "1 Month (Trial)": 1, "3 Months": 3, "6 Months": 6, "12 Months": 12 };
const getToday = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const STAGES = ["appointmentscheduled", "qualifiedtobuy", "presentationscheduled", "decisionmakerboughtin", "contractsent", "closedwon", "closedlost"];

async function api(action, params) {
  const res = await fetch("/api/hubspot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error");
  return data;
}

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ animation: "spin .8s linear infinite", flexShrink: 0 }}>
      <style dangerouslySetInnerHTML={{__html: "@keyframes spin{to{transform:rotate(360deg)}}"}} />
      <circle cx="8" cy="8" r="6" stroke={C.red} strokeWidth="2" fill="none" strokeDasharray="28" strokeDashoffset="10" />
    </svg>
  );
}

function KV({ label, value, red }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13, color: red ? C.red : C.offWhite, fontWeight: red ? 700 : 400 }}>{value || "—"}</span>
    </div>
  );
}

function StagePill({ stage }) {
  const won = stage?.toLowerCase().includes("won");
  const lost = stage?.toLowerCase().includes("lost");
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
      padding: "2px 8px", borderRadius: 4,
      background: won ? C.green + "33" : lost ? C.redDeep : C.charcoalLt,
      color: won ? C.greenLight : lost ? "#f08080" : C.muted,
      border: "1px solid " + (won ? C.green : lost ? C.red : C.border),
    }}>{stage || "—"}</span>
  );
}

function SHead({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: C.red, letterSpacing: "0.12em", textTransform: "uppercase", paddingBottom: 8, borderBottom: "1px solid " + C.border, marginBottom: 14 }}>
      {children}
    </div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, background: type === "success" ? C.green : C.redDeep, border: "1px solid " + (type === "success" ? C.greenLight : C.red), borderRadius: 8, padding: "12px 20px", fontSize: 13, color: C.white, fontFamily: FONT.body, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      {msg}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 6, fontFamily: FONT.body, letterSpacing: "0.05em", textTransform: "uppercase", transition: "all .15s", border: "none", background: active ? C.red : C.charcoalMid, color: active ? C.white : C.muted, outline: active ? "none" : "1px solid " + C.border }}>
      {children}
    </button>
  );
}

function ProposalDoc({ deal, type, duration, quoteTotal, docRef }) {
  const months = durMonths[duration] || 3;
  const base = quoteTotal ? Number(quoteTotal) : (deal.amount ? Number(deal.amount) : 0);
  const total = type === "retainer" ? base * months : base;
  const payRows = type === "retainer"
    ? [["Total Agreement Value", fmt(total), true], ["Monthly Rate", fmt(base), false], ["Annualized (12 mo)", fmt(base * 12), false], ["Billing Cycle", "Monthly — 1st of month", false], ["Payment Due", "Net 7 from invoice", false], ["Cancellation", "30 days written notice", false]]
    : [["Total Project Investment", fmt(total), true], ["Option A — Deposit (50%)", fmt(total * .5), false], ["Option A — On Delivery (50%)", fmt(total * .5), false], ["Option B — Deposit (40%)", fmt(total * .4), false], ["Option B — At Production (30%)", fmt(total * .3), false], ["Option B — On Delivery (30%)", fmt(total * .3), false]];

  return (
    <div ref={docRef} style={{ background: C.charcoalMid, border: "1px solid " + C.border, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ background: C.charcoal, padding: "22px 30px 16px", borderBottom: "3px solid " + C.red, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 700 }}>JMEDIA <span style={{ color: C.red }}>Productions</span></div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 }}>
            {type === "retainer" ? "Monthly Content Retainer Proposal" : "Production Project Proposal"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: C.muted }}>Prepared</div>
          <div style={{ fontSize: 13 }}>{getToday()}</div>
          {type === "retainer" && <div style={{ marginTop: 5 }}><StagePill stage={duration} /></div>}
        </div>
      </div>
      <div style={{ padding: "22px 30px" }}>
        <div style={{ marginBottom: 22 }}>
          <SHead>Client</SHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
            <KV label="Contact" value={deal.contact_name} />
            <KV label="Company" value={deal.company_name} />
            <KV label="Email" value={deal.contact_email} />
            <KV label="Deal Stage" value={deal.dealstage} />
          </div>
        </div>
        <div style={{ marginBottom: 22 }}>
          <SHead>{type === "retainer" ? "Retainer Scope" : "Project Scope"}</SHead>
          <div style={{ marginBottom: 10 }}><KV label={type === "retainer" ? "Retainer Name" : "Project Name"} value={deal.dealname} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
            <KV label="Stage" value={deal.dealstage} />
            <KV label="Est. Close Date" value={deal.closedate} />
          </div>
        </div>
        {(deal.notes || deal.description) && (
          <div style={{ marginBottom: 22 }}>
            <SHead>Notes</SHead>
            <div style={{ background: C.inputBg, border: "1px solid " + C.border, borderRadius: 6, padding: "11px 13px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {deal.notes || deal.description}
            </div>
          </div>
        )}
        <div>
          <SHead>Investment</SHead>
          {payRows.map(function(row) {
            var l = row[0], v = row[1], bold = row[2];
            return (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.border, fontSize: 13 }}>
                <span style={{ color: bold ? C.offWhite : C.muted, fontWeight: bold ? 700 : 400 }}>{l}</span>
                <span style={{ fontWeight: 700, color: bold ? C.red : C.offWhite, fontSize: bold ? 15 : 13 }}>{v}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ background: C.red, padding: "16px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: FONT.display, fontSize: 14, fontWeight: 700 }}>
            {type === "retainer" ? "Total Agreement Value" : "Total Investment"}
          </div>
          {type === "retainer" && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{fmt(base)} / mo · {duration}</div>}
          {type === "production" && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Deposit: {fmt(total * .5)} due at signing</div>}
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 24, fontWeight: 700 }}>{fmt(total)}</div>
      </div>
    </div>
  );
}

function PushPanel({ deal, onPushDone }) {
  var [quoteTotal, setQuoteTotal] = useState(deal.amount ? String(Math.round(deal.amount)) : "");
  var [newStage, setNewStage] = useState(deal.dealstage || "Proposal Sent");
  var [note, setNote] = useState("");
  var [pushing, setPushing] = useState(false);
  var [result, setResult] = useState(null);

  async function push() {
    setPushing(true);
    setResult(null);
    try {
      var r = await api("update", { dealId: deal.id, amount: quoteTotal || deal.amount, dealstage: newStage, note: note });
      setResult({ ok: r.success !== false, msg: r.message || "Deal updated." });
      if (r.success !== false) onPushDone(Object.assign({}, deal, { amount: quoteTotal, dealstage: newStage }));
    } catch (e) {
      setResult({ ok: false, msg: e.message || "Push failed." });
    }
    setPushing(false);
  }

  var inputStyle = { width: "100%", boxSizing: "border-box", background: C.inputBg, border: "1px solid " + C.border, borderRadius: 7, padding: "10px 12px", color: C.white, fontSize: 13, fontFamily: FONT.body, outline: "none" };

  return (
    <div style={{ background: C.charcoalMid, border: "1px solid " + C.border, borderRadius: 10, padding: "24px 28px" }}>
      <SHead>Push to HubSpot — {deal.dealname}</SHead>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quote Total (from OS)</div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>$</span>
            <input type="number" value={quoteTotal} onChange={function(e) { setQuoteTotal(e.target.value); }} placeholder="Enter from Quote Builder" style={Object.assign({}, inputStyle, { paddingLeft: 24 })} />
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>Current in HubSpot: {fmt(deal.amount)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Update Deal Stage</div>
          <select value={newStage} onChange={function(e) { setNewStage(e.target.value); }} style={Object.assign({}, inputStyle, { cursor: "pointer" })}>
            {STAGES.map(function(s) { return <option key={s}>{s}</option>; })}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Add Note (optional)</div>
        <textarea value={note} onChange={function(e) { setNote(e.target.value); }} rows={3} placeholder="e.g. Proposal sent via email. Quote based on 2-day shoot + full post package." style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.6 })} />
      </div>
      <div style={{ background: C.charcoal, borderRadius: 7, border: "1px solid " + C.border, padding: "13px 15px", marginBottom: 18, display: "flex", gap: 32, flexWrap: "wrap" }}>
        {[["Deal Amount", quoteTotal ? fmt(quoteTotal) : "(unchanged)"], ["Stage", newStage], ["Note", note ? "Will be added" : "Skipped"]].map(function(item) {
          return (
            <div key={item[0]}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item[0]}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{item[1]}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <button onClick={push} disabled={pushing} style={{ background: pushing ? C.charcoalLt : C.red, border: "none", borderRadius: 7, color: C.white, padding: "11px 26px", fontSize: 13, fontWeight: 700, cursor: pushing ? "default" : "pointer", fontFamily: FONT.body, display: "flex", alignItems: "center", gap: 8 }}>
          {pushing && <Spinner />}
          {pushing ? "Pushing…" : "Push to HubSpot"}
        </button>
        {result && (
          <div style={{ fontSize: 13, color: result.ok ? C.greenLight : "#f08080" }}>
            {result.ok ? "✓" : "✗"} {result.msg}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  var [query, setQuery] = useState("");
  var [deals, setDeals] = useState([]);
  var [selected, setSelected] = useState(null);
  var [activeTab, setActiveTab] = useState("pull");
  var [propType, setPropType] = useState("production");
  var [duration, setDuration] = useState("3 Months");
  var [quoteTotal, setQuoteTotal] = useState("");
  var [searching, setSearching] = useState(false);
  var [loadingDeal, setLoadingDeal] = useState(false);
  var [searchErr, setSearchErr] = useState(null);
  var [toast, setToast] = useState(null);
  var docRef = useRef(null);

  function showToast(msg, type) {
    setToast({ msg: msg, type: type || "success" });
    setTimeout(function() { setToast(null); }, 3500);
  }

  async function searchDeals() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchErr(null);
    setDeals([]);
    setSelected(null);
    try {
      var r = await api("search", { query: query });
      var arr = Array.isArray(r.deals) ? r.deals : [];
      if (!arr.length) setSearchErr("No deals found. Try a different search term.");
      setDeals(arr);
    } catch (e) {
      setSearchErr(e.message || "Could not reach HubSpot.");
    }
    setSearching(false);
  }

  async function pickDeal(deal) {
    setLoadingDeal(true);
    setSelected(null);
    setActiveTab("pull");
    try {
      var r = await api("get", { dealId: deal.id });
      setSelected(r.deal ? Object.assign({}, deal, r.deal) : deal);
      setQuoteTotal(deal.amount ? String(Math.round(deal.amount)) : "");
    } catch (e) {
      setSelected(deal);
    }
    setLoadingDeal(false);
  }

  function handlePushDone(updated) {
    setSelected(updated);
    showToast("HubSpot updated — " + updated.dealname, "success");
  }

  function copyProposal() {
    if (!docRef.current) return;
    navigator.clipboard.writeText(docRef.current.innerText)
      .then(function() { showToast("Proposal copied to clipboard", "success"); });
  }

  return (
    <div style={{ minHeight: "100vh", background: C.charcoal, fontFamily: FONT.body, color: C.white, display: "flex", flexDirection: "column" }}>
      <style dangerouslySetInnerHTML={{__html: "* { margin: 0; padding: 0; box-sizing: border-box; } input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1E2023; } ::-webkit-scrollbar-thumb { background: #3A3D42; border-radius: 3px; } @keyframes spin { to { transform: rotate(360deg); } }"}} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      <div style={{ background: C.charcoalMid, borderBottom: "1px solid " + C.border, padding: "0 28px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontFamily: FONT.display, fontSize: 17, fontWeight: 700 }}>
          JMEDIA <span style={{ color: C.red }}>Productions</span>
          <span style={{ fontFamily: FONT.body, fontSize: 12, color: C.muted, fontWeight: 400, marginLeft: 14 }}>HubSpot Sync</span>
        </div>
        <span style={{ fontSize: 10, background: C.redDeep, color: C.red, border: "1px solid " + C.red, borderRadius: 4, padding: "2px 8px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
          HubSpot Connected
        </span>
      </div>

      <div style={{ background: C.charcoalMid, borderBottom: "1px solid " + C.border, padding: "9px 28px", display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.muted, flexWrap: "wrap" }}>
        <span style={{ color: C.red, fontWeight: 700 }}>① Pull</span>
        <span>deal and contact info from HubSpot</span>
        <span style={{ color: C.border, margin: "0 4px" }}>|</span>
        <span style={{ color: C.offWhite, fontWeight: 600 }}>② Build quote in OS</span>
        <span style={{ color: C.border, margin: "0 4px" }}>|</span>
        <span style={{ color: C.red, fontWeight: 700 }}>③ Push</span>
        <span>final total back to HubSpot</span>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", height: "calc(100vh - 98px)" }}>
        <div style={{ width: 340, flexShrink: 0, borderRight: "1px solid " + C.border, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "18px 18px 12px", borderBottom: "1px solid " + C.border }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>Search Deals</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ flex: 1, background: C.inputBg, border: "1px solid " + C.border, borderRadius: 7, padding: "9px 12px", color: C.white, fontSize: 13, outline: "none", fontFamily: FONT.body }}
                placeholder="Client, company, deal name..."
                value={query}
                onChange={function(e) { setQuery(e.target.value); }}
                onKeyDown={function(e) { if (e.key === "Enter") searchDeals(); }}
              />
              <button onClick={searchDeals} disabled={searching} style={{ background: C.red, border: "none", borderRadius: 7, color: C.white, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT.body, display: "flex", alignItems: "center", gap: 6, minWidth: 58, justifyContent: "center" }}>
                {searching ? <Spinner /> : "Go"}
              </button>
            </div>
            {searchErr && <div style={{ fontSize: 12, color: "#f08080", marginTop: 7 }}>{searchErr}</div>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            {!deals.length && !searching && (
              <div style={{ color: C.muted, fontSize: 12, padding: "28px 8px", textAlign: "center", lineHeight: 1.9 }}>
                Search your HubSpot deals above.<br />Select one to begin.
              </div>
            )}
            {deals.map(function(deal) {
              return (
                <div key={deal.id} onClick={function() { pickDeal(deal); }} style={{ background: selected && selected.id === deal.id ? C.charcoalLt : C.charcoalMid, border: "1px solid " + (selected && selected.id === deal.id ? C.red : C.border), borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{deal.dealname || "Untitled"}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: C.muted }}>
                    <span>{deal.contact_name || deal.company_name || "—"}</span>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                      {deal.amount && <span style={{ fontWeight: 700, color: C.red, fontSize: 13 }}>{fmt(deal.amount)}</span>}
                      <StagePill stage={deal.dealstage} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "26px 34px" }}>
          {loadingDeal && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 12, color: C.muted }}>
              <Spinner size={20} /> Loading from HubSpot...
            </div>
          )}
          {!loadingDeal && !selected && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, color: C.muted, gap: 14, textAlign: "center" }}>
              <div style={{ fontSize: 48, opacity: 0.2 }}>⇄</div>
              <div style={{ fontFamily: FONT.display, fontSize: 20, color: C.offWhite, opacity: 0.45 }}>Two-Way HubSpot Sync</div>
              <div style={{ fontSize: 13, maxWidth: 340, lineHeight: 1.8 }}>Pull client data from HubSpot, build your quote in the Production OS, then push the final total and stage back.</div>
            </div>
          )}
          {!loadingDeal && selected && (
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <div style={{ background: C.charcoalMid, border: "1px solid " + C.border, borderRadius: 9, padding: "14px 20px", marginBottom: 20, display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Deal</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.dealname}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Client</div>
                  <div style={{ fontSize: 13 }}>{selected.contact_name || selected.company_name || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>HubSpot Amount</div>
                  <div style={{ fontWeight: 700, color: C.red, fontSize: 14 }}>{fmt(selected.amount)}</div>
                </div>
                <div style={{ marginLeft: "auto" }}><StagePill stage={selected.dealstage} /></div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <TabBtn active={activeTab === "pull"} onClick={function() { setActiveTab("pull"); }}>① Pull</TabBtn>
                <TabBtn active={activeTab === "proposal"} onClick={function() { setActiveTab("proposal"); }}>② Proposal</TabBtn>
                <TabBtn active={activeTab === "push"} onClick={function() { setActiveTab("push"); }}>③ Push</TabBtn>
              </div>

              {activeTab === "pull" && (
                <div style={{ background: C.charcoalMid, border: "1px solid " + C.border, borderRadius: 10, padding: "22px 26px" }}>
                  <SHead>Pulled from HubSpot</SHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 28px", marginBottom: 20 }}>
                    <KV label="Contact Name" value={selected.contact_name} />
                    <KV label="Company" value={selected.company_name} />
                    <KV label="Email" value={selected.contact_email} />
                    <KV label="Deal Stage" value={selected.dealstage} />
                    <KV label="Deal Amount" value={fmt(selected.amount)} red={true} />
                    <KV label="Est. Close Date" value={selected.closedate} />
                  </div>
                  {(selected.notes || selected.description) && (
                    <div>
                      <SHead>Notes</SHead>
                      <div style={{ background: C.inputBg, border: "1px solid " + C.border, borderRadius: 6, padding: "11px 13px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 16 }}>
                        {selected.notes || selected.description}
                      </div>
                    </div>
                  )}
                  <div style={{ padding: "13px 15px", background: C.inputBg, borderRadius: 7, border: "1px solid " + C.border, fontSize: 12, color: C.muted, lineHeight: 1.9 }}>
                    <span style={{ color: C.offWhite, fontWeight: 600 }}>Next: </span>
                    Open the JMEDIA Production OS and build your quote in Tab 2. Then come back to <span style={{ color: C.red, fontWeight: 600 }}>③ Push</span> to update HubSpot.
                  </div>
                </div>
              )}

              {activeTab === "proposal" && (
                <div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <TabBtn active={propType === "production"} onClick={function() { setPropType("production"); }}>Production</TabBtn>
                    <TabBtn active={propType === "retainer"} onClick={function() { setPropType("retainer"); }}>Retainer</TabBtn>
                    {propType === "retainer" && (
                      <select value={duration} onChange={function(e) { setDuration(e.target.value); }} style={{ background: C.inputBg, border: "1px solid " + C.border, borderRadius: 6, color: C.white, padding: "8px 12px", fontSize: 13, fontFamily: FONT.body, outline: "none" }}>
                        {Object.keys(durMonths).map(function(d) { return <option key={d}>{d}</option>; })}
                      </select>
                    )}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: C.muted }}>OS Quote Total:</span>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>$</span>
                        <input type="number" value={quoteTotal} onChange={function(e) { setQuoteTotal(e.target.value); }} placeholder="from OS" style={{ background: C.inputBg, border: "1px solid " + C.border, borderRadius: 6, padding: "8px 10px 8px 22px", color: C.white, fontSize: 13, fontFamily: FONT.body, outline: "none", width: 130 }} />
                      </div>
                      <button onClick={copyProposal} style={{ background: "transparent", border: "1px solid " + C.border, borderRadius: 6, color: C.muted, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT.body, letterSpacing: "0.06em", textTransform: "uppercase" }}>Copy</button>
                    </div>
                  </div>
                  <ProposalDoc deal={selected} type={propType} duration={duration} quoteTotal={quoteTotal} docRef={docRef} />
                </div>
              )}

              {activeTab === "push" && (
                <PushPanel deal={Object.assign({}, selected, { amount: quoteTotal || selected.amount })} onPushDone={handlePushDone} />
              )}

              <div style={{ height: 40 }} />
            </div>
          )}
        </div>
      </div>
      <Toast msg={toast && toast.msg} type={toast && toast.type} />
    </div>
  );
}
