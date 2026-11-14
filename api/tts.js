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

    // STEP 1: Analyze emotion and speaking style
    const styleResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this Bengali speech for natural human delivery.

Determine emotion, speed, tone, pauses, emphasis and laughter.

Understand the meaning and context.
Never force laughter or exaggerated emotions.
Return only valid JSON.
Do not rewrite the original text.

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

    const styleData = await styleResponse.json();

    if (!styleResponse.ok) {
      console.error("Style analysis error:", styleData);
      return res.status(502).json({
        success: false,
        error: "Emotion analysis failed"
      });
    }

    const styleText =
      styleData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!styleText) {
      return res.status(502).json({
        success: false,
        error: "No emotion analysis received"
      });
    }

    const style = JSON.parse(styleText);

    // STEP 2: Convert text into expressive speech
    const delivery = `
Emotion: ${style.emotion}.
Speaking speed: ${style.speed}.
Voice tone: ${style.tone}.
Pauses: ${style.pauses}.
Emphasis: ${style.emphasis}.
Laughter appropriate: ${style.laughter}.

Speak naturally according to these instructions.
Use subtle emotional expression and realistic conversational rhythm.
Do not exaggerate emotions or force laughter.
`;

    const ttsResponse = await fetch(
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

Voice: Warm, gentle, expressive female voice.
Language: Natural Bangladeshi Bengali.
Style: Caring, friendly and conversational.

${delivery}

Do not translate, rewrite, explain or add words.

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

    const audioData = await ttsResponse.json();

    if (!ttsResponse.ok) {
      console.error("TTS error:", audioData);
      return res.status(502).json({
        success: false,
        error: "TTS provider failed",
        providerMessage:
          audioData?.error?.message || "Unknown error"
      });
    }

    const audio =
      audioData.candidates?.[0]?.content?.parts?.find(
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
      mimeType: audio.mimeType,
      style: style
    });

  } catch (error) {
    console.error("Expressive TTS error:", error);

    return res.status(500).json({
      success: false,
      error: "Voice generation failed"
    });
  }
}
