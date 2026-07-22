import { useState, useEffect, useRef } from "react";
import { Send, Globe, GlobeLock, RotateCcw, Sparkles } from "lucide-react";

const STORAGE_KEY = "ek-chat-history";
const API_ENDPOINT = "/api/chat";

function OrbLogo({ size = 36 }) {
  return (
    <div className="orb-wrap" style={{ width: size, height: size }}>
      <span className="orb orb-a" />
      <span className="orb orb-b" />
      <span className="orb orb-c" />
      <span className="orb-core" />
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchOn, setSearchOn] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error("storage save failed", e);
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    if (taRef.current) taRef.current.style.height = "auto";

    try {
      const apiMessages = newMsgs.map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, searchOn }),
      });

      if (!response.ok) {
        throw new Error("API error: " + response.status);
      }

      const data = await response.json();
      const textParts = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n\n");

      const usedSearch = (data.content || []).some(
        (b) => b.type === "server_tool_use" || b.type === "web_search_tool_result"
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: textParts || "(khaali jawab mila, dobara try karein)",
          searched: usedSearch,
        },
      ]);
    } catch (e) {
      console.error(e);
      setError("Kuch gadbad ho gayi. Dobara koshish karein.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function newChat() {
    setMessages([]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <OrbLogo />
          <div className="title-block">
            <h1>एक</h1>
            <p>सारी ताकत, एक जगह</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={"pill" + (searchOn ? " pill-on" : "")}
            onClick={() => setSearchOn((s) => !s)}
            title="Web search on/off"
          >
            {searchOn ? <Globe size={15} /> : <GlobeLock size={15} />}
            <span>{searchOn ? "सर्च ऑन" : "सर्च ऑफ"}</span>
          </button>
          <button className="icon-btn" onClick={newChat} title="नई बातचीत">
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      <main className="chat" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty">
            <OrbLogo size={54} />
            <h2>कुछ भी पूछिए</h2>
            <p>
              कोडिंग, जानकारी, लिखना, सलाह, ताज़ा खबरें — जो भी सवाल हो,
              सीधा यहीं पूछें।
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={"row " + (m.role === "user" ? "row-user" : "row-bot")}>
            {m.role !== "user" && (
              <div className="avatar">
                <Sparkles size={14} />
              </div>
            )}
            <div className={"bubble " + (m.role === "user" ? "bubble-user" : "bubble-bot")}>
              {m.content}
              {m.searched && <div className="searched-tag">🌐 वेब से जानकारी ली गई</div>}
            </div>
          </div>
        ))}

        {loading && (
          <div className="row row-bot">
            <div className="avatar">
              <Sparkles size={14} />
            </div>
            <div className="bubble bubble-bot bubble-loading">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}
      </main>

      <footer className="composer">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          placeholder="अपना सवाल यहाँ लिखें..."
          rows={1}
        />
        <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
          <Send size={17} />
        </button>
      </footer>
    </div>
  );
}
