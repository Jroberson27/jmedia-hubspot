import { useState, useRef } from "react";

const C = {
  charcoal:    "#1E2023",
  charcoalMid: "#2A2D31",
  charcoalLt:  "#35383D",
  red:         "#8B1A1A",
  redDeep:     "#3D1010",
  white:       "#FFFFFF",
  offWhite:    "#F4F4F2",
  muted:       "#9A9A9A",
  border:      "#3A3D42",
  inputBg:     "#282B30",
  green:       "#2D6A2D",
  greenLight:  "#6fcf6f",
};
const FONT = { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" };
const fmt = (n) => n ? `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—";
const durMonths = { "1 Month (Trial)": 1, "3 Months": 3, "6 Months": 6, "12 Months": 12 };
const today = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const STAGES = ["Prospecting","Qualified","Proposal Sent","Negotiation","Contract Sent","Closed Won","Closed Lost"];

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
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return text.trim(); }
}

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ animation: "spin .8s linear infinite", flexShrink: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="8" cy="8" r="6" stroke={C.red} strokeWidth="2" fill="none" strokeDasharray="28" strokeDashoffset="10"/>
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
      border: `1px solid ${won ? C.green : lost ? C.red : C.border}`,
    }}>{stage || "—"}</span>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: C.red, letterSpacing: "0.12em",
      textTransform: "uppercase", paddingBottom: 8,
      borderBottom: `1px solid ${C.border}`, marginBottom: 14,
    }}>{children}</div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 999,
      background: type === "success" ? C.green : C.redDeep,
      border: `1px solid ${type === "success" ? C.greenLight : C.red}`,
      borderRadius: 8, padding: "12px 20px", fontSize: 13, color: C.white,
      fontFamily: FONT.body, boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }}>{msg}</div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer",
      borderRadius: 6, fontFamily: FONT.body, letterSpacing: "0.05em",
      textTransform: "uppercase", transition: "all .15s", border: "none",
      background: active ? C.red : C.charcoalMid,
      color: active ? C.white : C.muted,
      outline: active ? "none" : `1px solid ${C.border}`,
    }}>{children}</button>
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
    <div ref={docRef} style={{ background: C.charcoalMid, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ background: C.charcoal, padding: "22px 30px 16px", borderBottom: `3px solid ${C.red}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 700 }}>JMEDIA <span style={{ color: C.red }}>Productions</span></div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 }}>
            {type === "retainer" ? "Monthly Content Retainer Proposal" : "Production Project Proposal"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: C.muted }}>Prepared</div>
          <div style={{ fontSize: 13 }}>{today()}</div>
          {type === "retainer" && <div style={{ marginTop: 5 }}><StagePill stage={duration} /></div>}
        </div>
      </div>

      <div style={{ padding: "22px 30px" }}>
        <div style={{ marginBottom: 22 }}>
          <SectionHead>Client</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
            <KV label="Contact" value={deal.contact_name} />
            <KV label="Company" value={deal.company_name} />
            <KV label="Email" value={deal.contact_email} />
            <KV label="Deal Stage" value={deal.dealstage} />
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SectionHead>{type === "retainer" ? "Retainer Scope" : "Project Scope"}</SectionHead>
          <div style={{ marginBottom: 10 }}><KV label={type === "retainer" ? "Retainer Name" : "Project Name"} value={deal.dealname} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
            <KV label="Stage" value={deal.dealstage} />
            <KV label="Est. Close Date" value={deal.closedate} />
          </div>
        </div>

        {(deal.notes || deal.description) && (
          <div style={{ marginBottom: 22 }}>
            <SectionHead>Notes</SectionHead>
            <div style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "11px 13px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {deal.notes || deal.description}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 0 }}>
          <SectionHead>Investment</SectionHead>
          {payRows.map(([l, v, bold]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: bold ? C.offWhite : C.muted, fontWeight: bold ? 700 : 400 }}>{l}</span>
              <span style={{ fontWeight: 700, color: bold ? C.red : C.offWhite, fontSize: bold ? 15 : 13 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.red, padding: "16px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: FONT.display, fontSize: 14, fontWeight: 700 }}>
            {type === "retainer" ? "★  Total Agreement Value" : "★  Total Investment"}
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
  const [quoteTotal, setQuoteTotal] = useState(deal.amount ? String(Math.round(deal.amount)) : "");
  const [newStage, setNewStage] = useState(deal.dealstage || "Proposal Sent");
  const [note, setNote] = useState("");
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);

  async function push() {
    setPushing(true); setResult(null);
    try {
      const r = await api("update", { dealId: deal.id, amount: quoteTotal || deal.amount, dealstage: newStage, note })
      );
      const ok = typeof r === "object" ? r.success !== false : true;
      setResult({ ok, msg: typeof r === "object" ? r.message : "Deal updated successfully." });
      if (ok) onPushDone({ ...deal, amount: quoteTotal, dealstage: newStage });
    } catch { setResult({ ok: false, msg: "Push failed. Check your HubSpot connection." }); }
    finally { setPushing(false); }
  }

  const inputStyle = { width: "100%", boxSizing: "border-box", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 12px", color: C.white, fontSize: 13, fontFamily: FONT.body, outline: "none" };

  return (
    <div style={{ background: C.charcoalMid, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 28px" }}>
      <SectionHead>Push to HubSpot — {deal.dealname}</SectionHead>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quote Total (from OS)</div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>$</span>
            <input type="number" value={quoteTotal} onChange={e => setQuoteTotal(e.target.value)} placeholder="Enter from Quote Builder" style={{ ...inputStyle, paddingLeft: 24 }} />
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>Current in HubSpot: {fmt(deal.amount)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Update Deal Stage</div>
          <select value={newStage} onChange={e => setNewStage(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Add Note to Deal (optional)</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
          placeholder="e.g. Proposal sent via email. Quote based on 2-day shoot + full post package."
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
      </div>

      {/* Summary strip */}
      <div style={{ background: C.charcoal, borderRadius: 7, border: `1px solid ${C.border}`, padding: "14px 16px", marginBottom: 18, display: "flex", gap: 32, flexWrap: "wrap" }}>
        {[["Deal Amount", quoteTotal ? fmt(quoteTotal) : "(unchanged)"], ["Stage → ", newStage], ["Note", note ? "Will be added" : "Skipped"]].map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <button onClick={push} disabled={pushing} style={{
          background: pushing ? C.charcoalLt : C.red, border: "none", borderRadius: 7,
          color: C.white, padding: "11px 26px", fontSize: 13, fontWeight: 700,
          cursor: pushing ? "default" : "pointer", fontFamily: FONT.body,
          display: "flex", alignItems: "center", gap: 8, transition: "background .15s",
        }}>
          {pushing && <Spinner />}
          {pushing ? "Pushing to HubSpot…" : "Push to HubSpot →"}
        </button>
        {result && (
          <div style={{ fontSize: 13, color: result.ok ? C.greenLight : "#f08080", display: "flex", alignItems: "center", gap: 6 }}>
            {result.ok ? "✓" : "✗"} {result.msg}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [deals, setDeals] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [activeTab, setActiveTab] = useState("pull");
  const [proposalType, setProposalType] = useState("production");
  const [duration, setDuration] = useState("3 Months");
  const [quoteTotal, setQuoteTotal] = useState("");
  const [searching, setSearching] = useState(false);
  const [loadingDeal, setLoadingDeal] = useState(false);
  const [searchErr, setSearchErr] = useState(null);
  const [toast, setToast] = useState(null);
  const docRef = useRef(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function searchDeals() {
    if (!query.trim()) return;
    setSearching(true); setSearchErr(null); setDeals([]); setSelectedDeal(null);
    try {
      const r = await api("search", { query })". Return a JSON array of up to 8 deals. Each: { id, dealname, amount, dealstage, contact_name, company_name, closedate }. ONLY the JSON array.`);
      const arr = Array.isArray(r) ? r : [];
      if (!arr.length) setSearchErr("No deals found. Try a different search term.");
      setDeals(arr);
    } catch { setSearchErr("Could not reach HubSpot. Check your connection."); }
    finally { setSearching(false); }
  }

  async function pickDeal(deal) {
    setLoadingDeal(true); setSelectedDeal(null); setActiveTab("pull");
    try {
      const full = await api("get", { dealId: deal.id }). Include contact and notes. Return: { id, dealname, amount, dealstage, closedate, contact_name, contact_email, company_name, notes, description }. ONLY JSON.`);
      setSelectedDeal(typeof full === "object" && !Array.isArray(full) ? { ...deal, ...full } : deal);
      setQuoteTotal(deal.amount ? String(Math.round(deal.amount)) : "");
    } catch { setSelectedDeal(deal); }
    finally { setLoadingDeal(false); }
  }

  function handlePushDone(updated) {
    setSelectedDeal(updated);
    showToast(`HubSpot updated — ${updated.dealname}`, "success");
  }

  function copyProposal() {
    if (!docRef.current) return;
    navigator.clipboard.writeText(docRef.current.innerText)
      .then(() => showToast("Proposal copied to clipboard", "success"));
  }

  return (
    <div style={{ minHeight: "100vh", background: C.charcoal, fontFamily: FONT.body, color: C.white, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ background: C.charcoalMid, borderBottom: `1px solid ${C.border}`, padding: "0 28px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontFamily: FONT.display, fontSize: 17, fontWeight: 700 }}>
          JMEDIA <span style={{ color: C.red }}>Productions</span>
          <span style={{ fontFamily: FONT.body, fontSize: 12, color: C.muted, fontWeight: 400, marginLeft: 14 }}>× HubSpot Sync</span>
        </div>
        <span style={{ fontSize: 10, background: C.redDeep, color: C.red, border: `1px solid ${C.red}`, borderRadius: 4, padding: "2px 8px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
          HubSpot Connected
        </span>
      </div>

      {/* Workflow strip */}
      <div style={{ background: C.charcoalMid, borderBottom: `1px solid ${C.border}`, padding: "9px 28px", display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.muted, flexWrap: "wrap" }}>
        <span style={{ color: C.red, fontWeight: 700 }}>① HubSpot</span>
        <span>→ Pull deal & contact info</span>
        <span style={{ color: C.border, margin: "0 4px" }}>│</span>
        <span style={{ color: C.offWhite, fontWeight: 600 }}>② OS Quote Builder</span>
        <span>→ Calculate margins & final total</span>
        <span style={{ color: C.border, margin: "0 4px" }}>│</span>
        <span>Enter total here</span>
        <span>→</span>
        <span style={{ color: C.red, fontWeight: 700 }}>③ Push back to HubSpot</span>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 350, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "18px 18px 12px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>Search Deals</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ flex: 1, background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "9px 12px", color: C.white, fontSize: 13, outline: "none", fontFamily: FONT.body }}
                placeholder="Client, company, deal name…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchDeals()}
              />
              <button onClick={searchDeals} disabled={searching} style={{ background: C.red, border: "none", borderRadius: 7, color: C.white, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT.body, display: "flex", alignItems: "center", gap: 6 }}>
                {searching ? <Spinner /> : "Go"}
              </button>
            </div>
            {searchErr && <div style={{ fontSize: 12, color: "#f08080", marginTop: 7 }}>{searchErr}</div>}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            {!deals.length && !searching && (
              <div style={{ color: C.muted, fontSize: 12, padding: "28px 8px", textAlign: "center", lineHeight: 1.9 }}>
                Search your HubSpot deals above.<br />Select one to begin the workflow.
              </div>
            )}
            {deals.map(deal => (
              <div key={deal.id} onClick={() => pickDeal(deal)} style={{
                background: selectedDeal?.id === deal.id ? C.charcoalLt : C.charcoalMid,
                border: `1px solid ${selectedDeal?.id === deal.id ? C.red : C.border}`,
                borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer", transition: "all .15s",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{deal.dealname || "Untitled"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: C.muted }}>
                  <span>{deal.contact_name || deal.company_name || "—"}</span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    {deal.amount && <span style={{ fontWeight: 700, color: C.red, fontSize: 13 }}>{fmt(deal.amount)}</span>}
                    <StagePill stage={deal.dealstage} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflowY: "auto", padding: "26px 34px" }}>
          {loadingDeal && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 12, color: C.muted }}>
              <Spinner size={20} /> Loading deal from HubSpot…
            </div>
          )}

          {!loadingDeal && !selectedDeal && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, color: C.muted, gap: 14, textAlign: "center" }}>
              <div style={{ fontSize: 48, opacity: 0.2 }}>⇄</div>
              <div style={{ fontFamily: FONT.display, fontSize: 20, color: C.offWhite, opacity: 0.45 }}>Two-Way HubSpot Sync</div>
              <div style={{ fontSize: 13, maxWidth: 340, lineHeight: 1.8 }}>
                Pull client data from HubSpot, build your quote in the Production OS, then push the final total and deal stage back — no double entry.
              </div>
            </div>
          )}

          {!loadingDeal && selectedDeal && (
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              {/* Deal strip */}
              <div style={{ background: C.charcoalMid, border: `1px solid ${C.border}`, borderRadius: 9, padding: "14px 20px", marginBottom: 20, display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
                <div><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Deal</div><div style={{ fontWeight: 700, fontSize: 14 }}>{selectedDeal.dealname}</div></div>
                <div><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Client</div><div style={{ fontSize: 13 }}>{selectedDeal.contact_name || selectedDeal.company_name || "—"}</div></div>
                <div><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>HubSpot Amount</div><div style={{ fontWeight: 700, color: C.red, fontSize: 14 }}>{fmt(selectedDeal.amount)}</div></div>
                <div style={{ marginLeft: "auto" }}><StagePill stage={selectedDeal.dealstage} /></div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <TabBtn active={activeTab === "pull"} onClick={() => setActiveTab("pull")}>① Pull — Deal Info</TabBtn>
                <TabBtn active={activeTab === "proposal"} onClick={() => setActiveTab("proposal")}>② Proposal Preview</TabBtn>
                <TabBtn active={activeTab === "push"} onClick={() => setActiveTab("push")}>③ Push → HubSpot</TabBtn>
              </div>

              {/* Pull tab */}
              {activeTab === "pull" && (
                <div style={{ background: C.charcoalMid, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 26px" }}>
                  <SectionHead>Pulled from HubSpot</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 28px", marginBottom: 20 }}>
                    <KV label="Contact Name" value={selectedDeal.contact_name} />
                    <KV label="Company" value={selectedDeal.company_name} />
                    <KV label="Email" value={selectedDeal.contact_email} />
                    <KV label="Deal Stage" value={selectedDeal.dealstage} />
                    <KV label="Deal Amount" value={fmt(selectedDeal.amount)} red />
                    <KV label="Est. Close Date" value={selectedDeal.closedate} />
                  </div>
                  {(selectedDeal.notes || selectedDeal.description) && (
                    <>
                      <SectionHead>Notes</SectionHead>
                      <div style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "11px 13px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {selectedDeal.notes || selectedDeal.description}
                      </div>
                    </>
                  )}
                  <div style={{ marginTop: 18, padding: "13px 15px", background: C.inputBg, borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12, color: C.muted, lineHeight: 1.9 }}>
                    <span style={{ color: C.offWhite, fontWeight: 600 }}>Next → </span>
                    Open the <strong style={{ color: C.offWhite }}>JMEDIA Production OS</strong> and use this info to build your quote in Tab 2. Once you have your final total, come back to <strong style={{ color: C.red }}>③ Push</strong>.
                  </div>
                </div>
              )}

              {/* Proposal tab */}
              {activeTab === "proposal" && (
                <div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <TabBtn active={proposalType === "production"} onClick={() => setProposalType("production")}>Production</TabBtn>
                    <TabBtn active={proposalType === "retainer"} onClick={() => setProposalType("retainer")}>Retainer</TabBtn>
                    {proposalType === "retainer" && (
                      <select value={duration} onChange={e => setDuration(e.target.value)} style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, padding: "8px 12px", fontSize: 13, fontFamily: FONT.body, outline: "none" }}>
                        {Object.keys(durMonths).map(d => <option key={d}>{d}</option>)}
                      </select>
                    )}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: C.muted }}>OS Quote Total:</span>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>$</span>
                        <input type="number" value={quoteTotal} onChange={e => setQuoteTotal(e.target.value)} placeholder="from OS" style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px 8px 22px", color: C.white, fontSize: 13, fontFamily: FONT.body, outline: "none", width: 130 }} />
                      </div>
                      <button onClick={copyProposal} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT.body, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Copy
                      </button>
                    </div>
                  </div>
                  <ProposalDoc deal={selectedDeal} type={proposalType} duration={duration} quoteTotal={quoteTotal} docRef={docRef} />
                </div>
              )}

              {/* Push tab */}
              {activeTab === "push" && (
                <PushPanel deal={{ ...selectedDeal, amount: quoteTotal || selectedDeal.amount }} onPushDone={handlePushDone} />
              )}
            </div>
          )}
        </div>
      </div>

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}
