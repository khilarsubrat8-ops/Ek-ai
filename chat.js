      export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server missing GEMINI_API_KEY" }) };
  }

  try {
    const { messages } = JSON.parse(event.body);

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

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      statusCode: response.status,
      body: JSON.stringify({ content: [{ type: "text", text }] }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
      }
