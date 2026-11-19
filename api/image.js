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
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          model: "gemini-3.1-flash-image",
          input:
            "Generate one high-quality image based on this request. " +
            "Return an image, not just a written explanation. Prompt: " +
            prompt.trim()
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini image API error:",
        response.status,
        data?.error?.message || data
      );

      return res.status(502).json({
        success: false,
        error: data?.error?.message || "Image provider request failed"
      });
    }

    // First, check the direct output_image property.
    let image = data?.output_image;

    // If not found, check the steps array.
    if (!image?.data && Array.isArray(data?.steps)) {
      for (const step of data.steps) {
        if (Array.isArray(step?.content)) {
          image = step.content.find(
            item => item?.type === "image" && item?.data
          );

          if (image) break;
        }
      }
    }

    if (!image?.data) {
      console.error("No image data returned:", data);

      return res.status(502).json({
        success: false,
        error: "No image was returned"
      });
    }

    const mimeType =
      image.mime_type ||
      image.mimeType ||
      "image/png";

    return res.status(200).json({
      success: true,
      imageUrl: `data:${mimeType};base64,${image.data}`,
      mimeType: mimeType
    });

  } catch (error) {
    console.error("Image generation error:", error);

    return res.status(500).json({
      success: false,
      error: "Image generation failed"
    });
  }
}
