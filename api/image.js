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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "AI configuration missing"
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

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
          "Api-Revision": "2026-05-20"
        },
        body: JSON.stringify({
          model: "gemini-nano-banana-2.1",
          input: "Generate one image based on this user request. Return an image, not a written explanation. Prompt: " + prompt.trim()
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const providerMessage = data?.error?.message || "Image provider request failed";
      console.error("Gemini image API error:", response.status, providerMessage);
      return res.status(502).json({
        success: false,
        error: "Image provider request failed"
      });
    }

    let image = data?.output_image;
    if (!image?.data && Array.isArray(data?.steps)) {
      for (const step of data.steps) {
        const content = Array.isArray(step?.content) ? step.content : [];
        image = content.find(item => item?.type === "image" && item?.data);
        if (image) break;
      }
    }

    if (!image?.data) {
      console.error("Gemini image API returned no image data");
      return res.status(502).json({
        success: false,
        error: "No image was returned"
      });
    }

    const mimeType = typeof image.mime_type === "string"
      ? image.mime_type
      : (typeof image.mimeType === "string" ? image.mimeType : "image/png");

    return res.status(200).json({
      success: true,
      imageUrl: "data:" + mimeType + ";base64," + image.data
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return res.status(500).json({
      success: false,
      error: "Image generation failed"
    });
  }
}
