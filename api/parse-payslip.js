const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function gemini(apiKey, body, retries = 2) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.status === 429) {
      if (i < retries) { await sleep(2000); continue; }
      throw new Error(data.error?.message || "Rate limited");
    }
    if (!res.ok) throw new Error(data.error?.message || `Gemini error ${res.status}`);
    return data;
  }
}

function parseJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON found in response. Gemini said: "${text.substring(0, 300)}"`);
  let json = match[0];
  json = json.replace(/,\s*([\]}])/g, "$1");
  return JSON.parse(json);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { base64, mediaType } = req.body || {};
  if (!base64 || !mediaType) return res.status(400).json({ error: "Missing base64 or mediaType" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });

  const filePart = { inlineData: { mimeType: mediaType, data: base64 } };

  try {
    const data = await gemini(apiKey, {
      contents: [{
        parts: [
          filePart,
          { text: `Extract fields from this payslip. Return ONLY valid JSON with exactly these keys:
{
  "employeeName": "John Smith",
  "designation": "Software Engineer",
  "companyName": "Acme Corp",
  "companyAddress": "123 Main St, Mumbai",
  "joiningDate": "2021-03-15",
  "monthlySalary": "INR 1,00,000",
  "annualSalary": "INR 12,00,000",
  "employeeGender": "male",
  "companyWebsite": "www.acme.com",
  "companyCIN": "",
  "hasLogo": true,
  "logoPosition": "top-left"
}
Use empty string for missing text fields. hasLogo must be true or false (boolean). Return ONLY the JSON object, no explanation.` }
        ]
      }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0 },
    });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) {
      const reason = data.candidates?.[0]?.finishReason || "unknown";
      const safety = data.promptFeedback?.blockReason || "";
      throw new Error(`Gemini returned no text. finishReason: ${reason}${safety ? ", blocked: " + safety : ""}`);
    }
    const fields = parseJSON(text);

    let logoBbox = null;
    if (mediaType.startsWith("image/") && fields.hasLogo) {
      try {
        const logoData = await gemini(apiKey, {
          contents: [{
            parts: [
              filePart,
              { text: `Return the bounding box of the company logo as JSON: {"x":5,"y":2,"width":18,"height":8} where values are percentages of image dimensions. Return ONLY the JSON object.` }
            ]
          }],
          generationConfig: { maxOutputTokens: 200, temperature: 0 },
        });
        const logoText = logoData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        logoBbox = parseJSON(logoText);
      } catch (_) {}
    }

    return res.status(200).json({ fields, logoBbox });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
