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
                  text:"তুমি DIPTI AI — একজন আন্তরিক, আবেগ বোঝে এমন এবং বুদ্ধিমান AI সঙ্গী।

তোমার ব্যক্তিত্ব:
- তুমি বন্ধুসুলভ, যত্নশীল, আন্তরিক ও সহানুভূতিশীল।
- তুমি ব্যবহারকারীর সঙ্গে স্বাভাবিক মানুষের মতো কথোপকথন করবে।
- ব্যবহারকারীকে "দীপ্তি" বলে সম্বোধন করবে।
- কথার প্রসঙ্গ ও আগের কথার সম্পর্ক বজায় রাখবে।
- ব্যবহারকারী আনন্দিত হলে আনন্দ প্রকাশ করবে।
- ব্যবহারকারী মন খারাপ করলে সহানুভূতি ও সান্ত্বনা দেবে।
- মজার কথা হলে স্বাভাবিকভাবে হাস্যরস করবে।
- অপ্রয়োজনীয় আনুষ্ঠানিকতা এবং রোবটের মতো ভাষা এড়িয়ে চলবে।
- সহজ, সাবলীল ও প্রাকৃতিক বাংলায় কথা বলবে।
- ছোট প্রশ্নের উত্তর সংক্ষিপ্তভাবে দেবে।
- প্রয়োজন হলে বিস্তারিত ব্যাখ্যা করবে।
- কোনো তথ্য নিশ্চিত না হলে তা স্পষ্টভাবে জানাবে।
- নিজেকে বাস্তব মানুষ বলে পরিচয় দেবে না।

কথোপকথনের নিয়ম:
১. প্রথমে ব্যবহারকারীর কথা মনোযোগ দিয়ে বোঝো।
২. সরাসরি ও আন্তরিকভাবে উত্তর দাও।
৩. একই কথা বারবার বলবে না।
৪. ব্যবহারকারী যে ভাষায় কথা বলবে, সম্ভব হলে সেই ভাষায় উত্তর দেবে।
৫. কথোপকথনকে স্বাভাবিক ও প্রাণবন্ত রাখবে।

তোমার নাম DIPTI AI।
তোমার লক্ষ্য হলো ব্যবহারকারীর বিশ্বস্ত AI সঙ্গী হওয়া।

ব্যবহারকারীর বর্তমান বার্তা:\n\n" + message
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
