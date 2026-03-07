// pages/api/jmedia-key-detail.js
// JMEDIA Key Property Detail Auto-Generator — Pages Router version
//
// HubSpot Workflow Setup:
//   Trigger: Contact is Track A AND jmedia_key_detail is unknown
//   Action: Send webhook POST to https://jmedia-hubspot.vercel.app/api/jmedia-key-detail
//   Body: { "contactId": "{{contact.id}}", "company": "{{contact.company}}", "website": "{{contact.website}}", "email": "{{contact.email}}" }

const Anthropic = require("@anthropic-ai/sdk");

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ── Scrape homepage text ──────────────────────────────────────────────────────
async function scrapeWebsite(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JMEDIABot/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
    return text;
  } catch (err) {
    return `[Could not scrape site: ${err.message}]`;
  }
}

// ── Derive website from email domain ─────────────────────────────────────────
function deriveWebsite(email) {
  if (!email) return null;
  const domain = email.split("@")[1];
  const generic = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"]);
  if (!domain || generic.has(domain)) return null;
  return `https://www.${domain}`;
}

// ── Generate one-liner via Claude ─────────────────────────────────────────────
async function generateDetail(company, websiteText) {
  const client = new Anthropic.default({ apiKey: ANTHROPIC_API_KEY });

  const prompt = `You are writing outreach personalization for JMEDIA Productions, a video production company targeting boutique hotels, resorts, and hospitality brands.

Company: ${company}
Website content: ${websiteText}

Write ONE sentence (max 20 words) that:
- Is specific to THIS property based on what you see above
- Sounds conversational, not like marketing copy
- Identifies their video or content gap or missed storytelling opportunity
- Makes a hospitality decision-maker think "how did they know that?"
- Has no dashes or em dashes

Good examples:
- "You've built an entire Ayurveda-meets-oceanfront experience on Singer Island and the story just doesn't exist on camera yet"
- "Six private acres and 200 feet of shoreline in Key Largo, one of the most cinematic properties in the state and there's no video presence to show for it"
- "Fort Myers Beach beachfront property with a real comeback story after Hurricane Ian that nobody is telling on camera"

Return ONLY the sentence. No quotes, no explanation.`;

  const msg = await client.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 120,
    messages: [{ role: "user", content: prompt }],
  });

  return msg.content[0].text.trim().replace(/^["']|["']$/g, "");
}

// ── Write back to HubSpot ─────────────────────────────────────────────────────
async function updateHubSpot(contactId, detail) {
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: { jmedia_key_detail: detail } }),
    }
  );
  return res.ok;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Health check
  if (req.method === "GET") {
    return res.status(200).json({ status: "JMEDIA Key Detail endpoint is live" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { contactId, company, website, email } = req.body;

    if (!contactId || !company) {
      return res.status(400).json({ error: "contactId and company are required" });
    }

    // Resolve website URL
    const siteUrl = website || deriveWebsite(email);

    // Scrape website
    const websiteText = siteUrl
      ? await scrapeWebsite(siteUrl)
      : `Hospitality company: ${company}`;

    // Generate detail
    const detail = await generateDetail(company, websiteText);

    // Write to HubSpot
    const updated = await updateHubSpot(contactId, detail);

    if (!updated) {
      return res.status(500).json({ error: "HubSpot update failed", contactId, detail });
    }

    console.log(`[JMEDIA] Updated contact ${contactId} (${company}): "${detail}"`);

    return res.status(200).json({ success: true, contactId, company, detail });

  } catch (err) {
    console.error("[JMEDIA] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
