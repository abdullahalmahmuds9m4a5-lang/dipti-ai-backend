export default async function handler(req, res) {
  // CORS configuration
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
    const model = process.env.GEMINI_MODEL;

    if (!apiKey || !model) {
      return res.status(500).json({
        success: false,
        error: "AI configuration missing"
      });
    }

    const message = req.body?.message;

    if (
      typeof message !== "string" ||
      message.trim().length === 0 ||
      message.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid message"
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "তুমি DIPTI AI, একজন সহায়ক বাংলা AI Assistant। সহজ ও স্বাভাবিক বাংলায় উত্তর দাও। ব্যবহারকারীর প্রশ্নের উত্তর দাও:\n\n" + message
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

  const providerMessage =
    data?.error?.message || "Unknown Gemini API error";

  console.error(
    "Gemini API Error:",
    response.status,
    providerMessage
  );

  return res.status(502).json({
    success: false,
    error: "AI provider request failed",
    providerStatus: response.status,
    providerMessage: providerMessage
  });
}

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "দুঃখিত, উত্তর পাওয়া যায়নি।";

    return res.status(200).json({
      success: true,
      reply: answer
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Backend server error"
    });
  }
}
