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

    // ONE STEP: EXPRESSIVE TEXT TO SPEECH

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
              text: `
You are DIPTI AI, a warm and expressive female voice assistant.

Speak the following text exactly as written.

LANGUAGE:
Natural Bangladeshi Bengali.

VOICE:
Warm, gentle, friendly female voice.
Natural conversational rhythm.

EMOTIONAL DELIVERY:
Understand the meaning and context of the Bengali text.
Automatically choose an appropriate emotion.
Express happiness, curiosity, concern or seriousness naturally when appropriate.
Never force laughter or exaggerate emotions.

SPEAKING STYLE:
Use natural pauses between sentences.
Use appropriate emphasis on important words.
Avoid robotic or monotonous delivery.
Keep the speaking speed natural and moderately quick.

IMPORTANT:
Do not translate the text.
Do not rewrite it.
Do not add extra words.
Do not explain anything.
Speak only the exact transcript below.

TRANSCRIPT:
${text.trim()}
`
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

      console.error("TTS provider error:", data);

      return res.status(502).json({
        success: false,
        error: "TTS provider failed",
        providerMessage:
          data?.error?.message || "Unknown error"
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

      mimeType: audio.mimeType,

      style: {
        emotion: "context-aware",
        speed: "moderately quick",
        tone: "expressive",
        pauses: "natural",
        emphasis: "context-aware",
        laughter: "natural when appropriate"
      }
    });

  } catch (error) {

    console.error("Fast TTS error:", error);

    return res.status(500).json({
      success: false,
      error: "Voice generation failed"
    });
  }
}
