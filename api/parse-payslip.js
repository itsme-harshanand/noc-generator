export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { base64, mediaType } = req.body || {};
  if (!base64 || !mediaType) return res.status(400).json({ error: "Missing base64 or mediaType" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };

  const contentBlock = mediaType === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: mediaType, data: base64 } }
    : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };

  try {
    // Extract text fields
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            contentBlock,
            { type: "text", text: `Extract the following fields from this payslip. Return ONLY a JSON object with these keys (use empty string if not found):
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
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || `Anthropic error ${response.status}` });
    }

    const text = data.content?.map(c => c.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const fields = JSON.parse(clean);

    // If image with logo, get bounding box for cropping
    let logoBbox = null;
    if (mediaType.startsWith("image/") && fields.hasLogo) {
      try {
        const logoRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 200,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
                { type: "text", text: `Give me the bounding box of JUST the company logo as percentages of image size. Return ONLY JSON: {"x":0,"y":0,"width":20,"height":10} where x,y are top-left %, width/height are %. Return ONLY JSON.` }
              ]
            }]
          })
        });
        const logoData = await logoRes.json();
        const logoText = logoData.content?.map(c => c.text || "").join("") || "";
        logoBbox = JSON.parse(logoText.replace(/```json|```/g, "").trim());
      } catch (_) {}
    }

    return res.status(200).json({ fields, logoBbox });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
