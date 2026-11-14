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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
             text: `Speak the following transcript exactly as written.

Voice: A warm, gentle, expressive female voice.
Language: Natural Bangladeshi Bengali.
Style: Sound like a caring person having a real conversation.
Delivery: Smooth, relaxed, emotionally expressive speech.
Use natural Bengali pronunciation, subtle pitch variation,
gentle pauses, and realistic conversational rhythm.
Avoid robotic, flat, exaggerated, or overly dramatic delivery.
Keep the voice soft, clear, friendly, and intimate.
Do not translate, rewrite, explain, or add any words.

Transcript:
${text}`
            }]
          }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Achernar"
                }
              }
            }
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("TTS error:", response.status, data);
      return res.status(502).json({
        success: false,
        error: "TTS provider failed",
        providerStatus: response.status,
        providerMessage: data?.error?.message || "Unknown error"
      });
    }

    const audio =
      data.candidates?.[0]?.content?.parts?.find(
        part => part.inlineData
      )?.inlineData;

    if (!audio?.data) {
      return res.status(502).json({
        success: false,
        error: "Audio not received"
      });
    }

    return res.status(200).json({
      success: true,
      audio: audio.data,
      mimeType: audio.mimeType
    });

  } catch (error) {
    console.error("TTS backend error:", error);

    return res.status(500).json({
      success: false,
      error: "Backend server error"
    });
  }
}
