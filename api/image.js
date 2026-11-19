export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return res.status(500).json({
        success: false,
        error: "Cloudflare configuration missing"
      });
    }

    const prompt = req.body?.prompt;

    if (
      typeof prompt !== "string" ||
      prompt.trim().length === 0 ||
      prompt.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        error: "Prompt must be between 1 and 2000 characters"
      });
    }

    // Prepare image generation request
    const formData = new FormData();

    formData.append("prompt", prompt.trim());
    formData.append("width", "1024");
    formData.append("height", "1024");

    const model = "@cf/black-forest-labs/flux-2-klein-9b";

    const apiUrl =
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`
      },
      body: formData
    });

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Cloudflare returned invalid JSON");
      return res.status(502).json({
        success: false,
        error: "Invalid image provider response"
      });
    }

    if (!response.ok || data.success === false) {
      console.error(
        "Cloudflare Image API Error:",
        response.status,
        data.errors || data
      );

      return res.status(502).json({
        success: false,
        error: "Image generation provider failed"
      });
    }

    const imageBase64 = data.result?.image;

    if (
      typeof imageBase64 !== "string" ||
      imageBase64.length === 0
    ) {
      console.error("No image data received from Cloudflare");

      return res.status(502).json({
        success: false,
        error: "No image was returned"
      });
    }

    // Return image in Android-compatible format
    return res.status(200).json({
      success: true,
      imageUrl: "data:image/png;base64," + imageBase64
    });

  } catch (error) {
    console.error("Image Generation Error:", error);

    return res.status(500).json({
      success: false,
      error: "Image generation failed"
    });
  }
}
