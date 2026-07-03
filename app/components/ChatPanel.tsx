"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// AIの応答からJSON選択肢を抽出
function parseOptions(text: string): { text: string; options: string[] | null } {
  const regex = /```options\s*\n([\s\S]*?)\n```/;
  const match = text.match(regex);
  if (!match) {
    return { text, options: null };
  }
  try {
    const arr = JSON.parse(match[1]);
    if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
      const cleanedText = text.replace(regex, "").trim();
      return { text: cleanedText, options: arr };
    }
  } catch {
    // JSON parseに失敗した場合は無視
  }
  return { text, options: null };
}

const WELCOME_MESSAGE = `こんにちは、新規事業開発チームの顧客理解コーチです🙌

アンケートをセルフレビューしながら品質を高めていく、お手伝いをさせていただきます。

まずは、ご担当されている事業について少し教えてください。
今、どのフェーズにありますか?

\`\`\`options
["アイデア段階", "プロトタイプ作成中", "リリース済み・改善中", "その他"]
\`\`\``;

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const latestMessage = messages[messages.length - 1];
  const showOptions =
    !isStreaming &&
    latestMessage?.role === "assistant" &&
    latestMessage.content.length > 0;
  const { options: latestOptions } = showOptions
    ? parseOptions(latestMessage.content)
    : { options: null };

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    // ウェルカムメッセージはAPIには送らない(Geminiは最初がuser role必須)
    const messagesForApi = nextMessages.filter(
      (m, idx) => !(idx === 0 && m.role === "assistant")
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesForApi }),
      });

      if (!res.ok) throw new Error("API error");

      const text = await res.text();
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: text };
        return copy;
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "申し訳ありません、エラーが発生しました。もう一度お試しください。",
        };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSend() {
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.coachAvatar}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div style={styles.headerTitle}>Chat_Prototype</div>
        </div>
      </header>

      {/* メッセージエリア */}
      <div style={styles.messagesWrapper} ref={scrollRef}>
        <div style={styles.messagesInner}>
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}

          {isStreaming &&
            messages[messages.length - 1]?.role === "assistant" &&
            messages[messages.length - 1]?.content === "" && <TypingIndicator />}
        </div>
      </div>

      {/* 選択肢ブロック */}
      {latestOptions && latestOptions.length > 0 && (
        <div style={styles.optionsBlock}>
          <div style={styles.optionsInner}>
            <div style={styles.optionsLabel}>選択肢をタップ:</div>
            <div style={styles.optionsList}>
              {latestOptions.map((opt, i) => (
                <button
                  key={i}
                  style={styles.optionButton}
                  onClick={() => sendMessage(opt)}
                  disabled={isStreaming}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 入力エリア */}
      <div style={styles.inputArea}>
        <div style={styles.inputInner}>
          <textarea
            style={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... (⌘/Ctrl + Enter で送信)"
            rows={3}
            disabled={isStreaming}
          />
          <button
            style={{
              ...styles.sendButton,
              ...(isStreaming || !input.trim() ? styles.sendButtonDisabled : {}),
            }}
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
          >
            {isStreaming ? "送信中..." : "送信"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// メッセージ吹き出し
// ============================================
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const displayText = isUser ? message.content : parseOptions(message.content).text;

  return (
    <div
      style={{
        ...styles.bubbleRow,
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          ...styles.bubble,
          ...(isUser ? styles.bubbleUser : styles.bubbleAi),
        }}
      >
        {displayText || "\u00A0"}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={styles.bubbleRow}>
      <div style={{ ...styles.bubble, ...styles.bubbleAi }}>
        <span style={styles.typingDot}>●</span>
        <span style={{ ...styles.typingDot, animationDelay: "0.2s" }}>●</span>
        <span style={{ ...styles.typingDot, animationDelay: "0.4s" }}>●</span>
        <style>{`@keyframes typing {0%,60%,100%{opacity:0.3}30%{opacity:1}}`}</style>
      </div>
    </div>
  );
}

// ============================================
// スタイル(全画面版・中央寄せの読みやすさ重視)
// ============================================
const CONTENT_MAX_WIDTH = 780;

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "var(--brand-lighter)",
  },
  header: {
    background: "var(--panel-bg)",
    borderBottom: "1px solid var(--border)",
    padding: "16px 24px",
  },
  headerInner: {
    maxWidth: CONTENT_MAX_WIDTH,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "var(--brand-light)",
    color: "var(--brand)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: "var(--heading--small)",
    fontWeight: 600,
    color: "var(--text)",
    letterSpacing: 0.3,
  },
  messagesWrapper: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
  },
  messagesInner: {
    maxWidth: CONTENT_MAX_WIDTH,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  bubbleRow: {
    display: "flex",
    width: "100%",
  },
  bubble: {
    maxWidth: "80%",
    padding: "14px 18px",
    borderRadius: 18,
    fontSize: "var(--text--large)",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  bubbleUser: {
    background: "var(--brand)",
    color: "var(--component---white)",
    borderBottomRightRadius: 6,
  },
  bubbleAi: {
    background: "var(--panel-bg)",
    color: "var(--text)",
    border: "1px solid var(--brand-light)",
    borderBottomLeftRadius: 6,
    boxShadow: "var(--shadow-bubble)",
  },
  typingDot: {
    display: "inline-block",
    fontSize: 8,
    color: "var(--brand)",
    margin: "0 2px",
    animation: "typing 1.4s infinite",
  },
  // 選択肢ブロック
  optionsBlock: {
    borderTop: "1px solid var(--border)",
    background: "var(--panel-bg)",
    padding: "16px 24px",
  },
  optionsInner: {
    maxWidth: CONTENT_MAX_WIDTH,
    margin: "0 auto",
  },
  optionsLabel: {
    fontSize: "var(--text--default)",
    color: "var(--text-muted)",
    marginBottom: 10,
  },
  optionsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    textAlign: "left",
    padding: "10px 16px",
    background: "var(--brand-lighter)",
    border: "1px solid var(--brand-light)",
    color: "var(--brand-hover)",
    fontSize: "var(--text--large)",
    borderRadius: 20,
    transition: "all 0.15s",
    cursor: "pointer",
  },
  // 入力エリア
  inputArea: {
    borderTop: "1px solid var(--border)",
    background: "var(--panel-bg)",
    padding: "16px 24px",
  },
  inputInner: {
    maxWidth: CONTENT_MAX_WIDTH,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  textarea: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid var(--chat-input-border)",
    borderRadius: 12,
    background: "var(--chat-input-bg)",
    color: "var(--text)",
    fontSize: "var(--text--large)",
    outline: "none",
    boxShadow: "var(--shadow-input)",
    lineHeight: 1.6,
  },
  sendButton: {
    alignSelf: "flex-end",
    padding: "10px 28px",
    background: "var(--brand)",
    color: "var(--component---white)",
    fontSize: "var(--text--large)",
    fontWeight: 500,
    borderRadius: 20,
    cursor: "pointer",
  },
  sendButtonDisabled: {
    background: "var(--component---disabled)",
    color: "var(--text-disabled)",
    cursor: "not-allowed",
  },
};
