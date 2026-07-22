export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
  }

  try {
    const { messages, searchOn } = req.body;

    const body = {
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system:
        "Tum 'Ek' ho — ek behtareen, sabse powerful AI assistant, jo Hindi/Hinglish mein baat karta hai (jaisi bhaasha user use kare, waisi hi jawab do). Tum har tarah ke sawal ka jawab de sakte ho — general knowledge, coding, likhna, samjhana, tarkeekaran, aur agar zaroorat ho to web search bhi kar sakte ho current jaankari ke liye. Jawab clear, seedha, aur madadgar hona chahiye.",
      messages,
      ...(searchOn
        ? { tools: [{ type: "web_search_20250305", name: "web_search" }] }
        : {}),
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
