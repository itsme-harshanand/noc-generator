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
          { text: `Extract the following fields from this payslip. Return ONLY a JSON object with these keys (use empty string if not found):
{
  "employeeName": "",
  "designation": "",
  "companyName": "",
  "companyAddress": "",
  "joiningDate": "",
  "monthlySalary": "",
  "annualSalary": "",
  "employeeGender": "male or female based on name/title",
  "companyWebsite": "",
  "companyCIN": "",
  "hasLogo": true or false,
  "logoPosition": "top-left, top-center, or top-right. Empty if no logo."
}
Return ONLY the JSON, no other text.` }
        ]
      }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0 },
    });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const fields = JSON.parse(text.replace(/```json|```/g, "").trim());

    let logoBbox = null;
    if (mediaType.startsWith("image/") && fields.hasLogo) {
      try {
        const logoData = await gemini(apiKey, {
          contents: [{
            parts: [
              filePart,
              { text: `Give me the bounding box of JUST the company logo as percentages of image size. Return ONLY JSON: {"x":0,"y":0,"width":20,"height":10} where x,y are top-left %, width/height are %. Return ONLY JSON.` }
            ]
          }],
          generationConfig: { maxOutputTokens: 200, temperature: 0 },
        });
        const logoText = logoData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        logoBbox = JSON.parse(logoText.replace(/```json|```/g, "").trim());
      } catch (_) {}
    }

    return res.status(200).json({ fields, logoBbox });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
