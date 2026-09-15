import { useEffect, useRef, useState } from "react";
import { askDestinationQuestion, GeminiApiError } from "../../api/gemini";
import "./ChatWidget.css";

const SUGGESTIONS = [
  "How many days should I spend here?",
  "What's the best time of year to go?",
  "What should I budget per day?",
];

function SparkleIcon({ width = 18, height = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none" aria-hidden="true">
      <path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
        fill="currentColor"
      />
      <path d="M19 15l.7 1.9L21.5 17.5l-1.8.6L19 20l-.7-1.9-1.8-.6 1.8-.6L19 15Z" fill="currentColor" />
    </svg>
  );
}

export function ChatWidget({ destination }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | error
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, status]);

  async function send(text) {
    const question = text.trim();
    if (!question || status === "sending") return;

    const nextMessages = [...messages, { role: "user", text: question }];
    setMessages(nextMessages);
    setInput("");
    setStatus("sending");

    try {
      const answer = await askDestinationQuestion(destination, question, messages);
      setMessages((prev) => [...prev, { role: "model", text: answer }]);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      console.error("Chat request failed:", err);
      const isMissingKey = err instanceof GeminiApiError && err.message.includes("GEMINI_API_KEY");
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: isMissingKey
            ? "The assistant isn't configured yet — add a Gemini API key to enable it."
            : import.meta.env.DEV
              ? `That didn't go through. ${err.message}`
              : "That didn't go through. Try asking again.",
          isError: true,
        },
      ]);
    }
  }

  return (
    <div className="chat-widget-overlay">
      <div className="chat-widget">
        {open && (
        <div className="chat-widget__panel" role="dialog" aria-label={`AI assistant — ask about ${destination.name}`}>
          <div className="chat-widget__header">
            <div>
              <p className="chat-widget__header-title">
                <SparkleIcon width={15} height={15} />
                Ask about {destination.name}
              </p>
              <p className="chat-widget__header-subtitle">AI travel assistant</p>
            </div>
            <button
              type="button"
              className="chat-widget__close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="chat-widget__list" ref={listRef}>
            {messages.length === 0 && (
              <div className="chat-widget__empty">
                <p>Ask anything about {destination.name} — timing, sights, budget, logistics.</p>
                <div className="chat-widget__suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-bubble chat-bubble--${m.role}${m.isError ? " chat-bubble--error" : ""}`}
              >
                {m.text}
              </div>
            ))}
            {status === "sending" && (
              <div className="chat-bubble chat-bubble--model chat-bubble--typing" aria-live="polite">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <form
            className="chat-widget__form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label className="visually-hidden" htmlFor="chat-input">
              Ask a question
            </label>
            <input
              id="chat-input"
              type="text"
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" aria-label="Send" disabled={!input.trim() || status === "sending"}>
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path d="M2 10h15M11 4l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={open ? "chat-widget__launcher chat-widget__launcher--open" : "chat-widget__launcher"}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close AI travel assistant" : "Ask the AI travel assistant a question"}
      >
        {open ? (
          <svg viewBox="0 0 16 16" width="18" height="18" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        ) : (
          <>
            <SparkleIcon />
            <span className="chat-widget__launcher-label">Ask AI</span>
          </>
        )}
      </button>
      </div>
    </div>
  );
}
