export default async function handler(req, res) {
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
        error: "API key missing"
      });
    }

    const { text } = req.body || {};

    if (
      typeof text !== "string" ||
      !text.trim() ||
      text.length > 3000
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid text"
      });
    }

    const response = await fetch(
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this Bengali speech text for natural human voice delivery.

Determine:
- emotion: neutral, happy, sad, caring, surprised, excited
- speed: slow, normal, fast
- tone: soft, warm, energetic, serious, neutral
- pauses: where short or long pauses are appropriate
- emphasis: which words need emphasis
- laughter: whether a gentle natural laugh is appropriate

Rules:
1. Understand the meaning and context, not just punctuation.
2. Never force laughter or exaggerated emotion.
3. Use a natural conversational human style.
4. Return only valid JSON.
5. Do not rewrite the original text.

Text:
${text}`
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                emotion: { type: "STRING" },
                speed: { type: "STRING" },
                tone: { type: "STRING" },
                pauses: { type: "STRING" },
                emphasis: { type: "STRING" },
                laughter: { type: "BOOLEAN" }
              },
              required: [
                "emotion",
                "speed",
                "tone",
                "pauses",
                "emphasis",
                "laughter"
              ]
            }
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: data?.error?.message || "Gemini failed"
      });
    }

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      return res.status(502).json({
        success: false,
        error: "No analysis received"
      });
    }

    return res.status(200).json({
      success: true,
      style: JSON.parse(result)
    });

  } catch (error) {
    console.error("Voice style error:", error);

    return res.status(500).json({
      success: false,
      error: "Voice style analysis failed"
    });
  }
}
