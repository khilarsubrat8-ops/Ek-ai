export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server missing GEMINI_API_KEY" });
  }

  try {
    const { messages } = req.body;

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const systemInstruction = {
      parts: [{
        text: "Tum 'Ek' ho — ek behtareen AI assistant, jo Hindi/Hinglish mein baat karta hai (jaisi bhaasha user use kare, waisi hi jawab do). Tum har tarah ke sawal ka jawab de sakte ho — general knowledge, coding, likhna, samjhana, tarkeekaran. Jawab clear, seedha, aur madadgar hona chahiye."
      }]
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, systemInstruction }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.status(200).json({
      content: [{ type: "text", text }],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
