const HS = "https://api.hubapi.com";
const token = () => process.env.HUBSPOT_API_KEY;
const hdrs = () => ({ Authorization: "Bearer " + token(), "Content-Type": "application/json" });

async function getContact(dealId) {
  try {
    const a = await fetch(HS + "/crm/v3/objects/deals/" + dealId + "/associations/contacts", { headers: hdrs() }).then(r => r.json());
    const id = a.results?.[0]?.id;
    if (!id) return null;
    const c = await fetch(HS + "/crm/v3/objects/contacts/" + id + "?properties=firstname,lastname,email", { headers: hdrs() }).then(r => r.json());
    return {
      name: ((c.properties?.firstname || "") + " " + (c.properties?.lastname || "")).trim() || null,
      email: c.properties?.email || null,
    };
  } catch { return null; }
}

async function getCompany(dealId) {
  try {
    const a = await fetch(HS + "/crm/v3/objects/deals/" + dealId + "/associations/companies", { headers: hdrs() }).then(r => r.json());
    const id = a.results?.[0]?.id;
    if (!id) return null;
    const c = await fetch(HS + "/crm/v3/objects/companies/" + id + "?properties=name", { headers: hdrs() }).then(r => r.json());
    return c.properties?.name || null;
  } catch { return null; }
}

async function searchDeals(query) {
  const body = {
    filterGroups: [{ filters: [{ propertyName: "dealname", operator: "CONTAINS_TOKEN", value: query }] }],
    properties: ["dealname", "amount", "dealstage", "closedate"],
    limit: 8,
  };
  const res = await fetch(HS + "/crm/v3/objects/deals/search", { method: "POST", headers: hdrs(), body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Search failed");
  return Promise.all((data.results || []).map(async d => {
    const [contact, company] = await Promise.all([getContact(d.id), getCompany(d.id)]);
    return {
      id: d.id,
      dealname: d.properties.dealname,
      amount: d.properties.amount,
      dealstage: d.properties.dealstage,
      closedate: d.properties.closedate ? new Date(d.properties.closedate).toLocaleDateString("en-US") : null,
      contact_name: contact?.name || null,
      contact_email: contact?.email || null,
      company_name: company || null,
    };
  }));
}

async function getDeal(dealId) {
  const res = await fetch(HS + "/crm/v3/objects/deals/" + dealId + "?properties=dealname,amount,dealstage,closedate,description", { headers: hdrs() });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message || "Get failed");
  const [contact, company] = await Promise.all([getContact(dealId), getCompany(dealId)]);
  let notes = null;
  try {
    const na = await fetch(HS + "/crm/v3/objects/deals/" + dealId + "/associations/notes", { headers: hdrs() }).then(r => r.json());
    const nid = na.results?.[0]?.id;
    if (nid) {
      const n = await fetch(HS + "/crm/v3/objects/notes/" + nid + "?properties=hs_note_body", { headers: hdrs() }).then(r => r.json());
      notes = n.properties?.hs_note_body || null;
    }
  } catch {}
  return {
    id: d.id,
    dealname: d.properties.dealname,
    amount: d.properties.amount,
    dealstage: d.properties.dealstage,
    closedate: d.properties.closedate ? new Date(d.properties.closedate).toLocaleDateString("en-US") : null,
    description: d.properties.description || null,
    contact_name: contact?.name || null,
    contact_email: contact?.email || null,
    company_name: company || null,
    notes,
  };
}

async function updateDeal(dealId, amount, dealstage, note) {
  const res = await fetch(HS + "/crm/v3/objects/deals/" + dealId, {
    method: "PATCH",
    headers: hdrs(),
    body: JSON.stringify({ properties: { amount: String(amount), dealstage } }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Update failed"); }
  if (note) {
    const nr = await fetch(HS + "/crm/v3/objects/notes", {
      method: "POST", headers: hdrs(),
      body: JSON.stringify({ properties: { hs_note_body: note, hs_timestamp: new Date().toISOString() } }),
    });
    if (nr.ok) {
      const nn = await nr.json();
      await fetch(HS + "/crm/v4/objects/notes/" + nn.id + "/associations/deals/" + dealId, {
        method: "PUT", headers: hdrs(),
        body: JSON.stringify([{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }]),
      });
    }
  }
  return { success: true, message: "Updated — $" + Number(amount).toLocaleString() + " | Stage: \"" + dealstage + "\"" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!token()) return res.status(500).json({ error: "HUBSPOT_API_KEY not configured in Vercel environment variables." });
  const { action, query, dealId, amount, dealstage, note } = req.body;
  try {
    if (action === "search") return res.status(200).json({ deals: await searchDeals(query) });
    if (action === "get")    return res.status(200).json({ deal: await getDeal(dealId) });
    if (action === "update") return res.status(200).json(await updateDeal(dealId, amount, dealstage, note));
    return res.status(400).json({ error: "Unknown action" });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
