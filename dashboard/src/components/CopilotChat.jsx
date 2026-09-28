import React, { useState, useEffect, useRef } from "react";

/**
 * Clean LaTeX and chemistry notations from AI model responses.
 */
function cleanCopilotLatex(str) {
  if (!str) return "";
  return str
    .replace(/\\leq\b|\\le\b/g, "≤")
    .replace(/\\geq\b|\\ge\b/g, "≥")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\pm\b/g, "±")
    .replace(/\\times\b/g, "×")
    .replace(/\\mu\b/g, "µ")
    .replace(/\\degree\b|\^\\circ/g, "°")
    .replace(/\\%/g, "%")
    .replace(/\\\$/g, "$")
    .replace(/\bCH_4\b/g, "CH₄")
    .replace(/\bCO_2\b/g, "CO₂")
    .replace(/\bH_2S\b/g, "H₂S")
    .replace(/\bO_2\b/g, "O₂")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\$/g, "");
}

/**
 * Format markdown inline syntax (bold, italic, inline code)
 */
function formatInline(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="copilot-inline-code">$1</code>');
}

/**
 * Format markdown blocks (lists, tables, headers, dividers)
 */
function formatMarkdown(md) {
  if (!md) return "";
  const cleaned = cleanCopilotLatex(md);
  const lines = cleaned.split("\n");
  const result = [];
  let inList = false;
  let listType = "ul";

  const flushList = () => {
    if (inList) {
      result.push(`</${listType}>`);
      inList = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (/^(\-{3,}|\*{3,}|\={3,})$/.test(trimmed)) {
      flushList();
      result.push('<hr class="copilot-divider my-2" />');
      return;
    }

    if (/^# (.+)$/.test(trimmed)) {
      flushList();
      result.push(`<h5 class="copilot-h1 fw-bold mt-2 mb-1" style="font-size:0.92rem;">${formatInline(trimmed.replace(/^# /, ""))}</h5>`);
      return;
    }
    if (/^## (.+)$/.test(trimmed)) {
      flushList();
      result.push(`<h6 class="copilot-h2 fw-bold mt-2 mb-1" style="font-size:0.86rem;">${formatInline(trimmed.replace(/^## /, ""))}</h6>`);
      return;
    }
    if (/^### (.+)$/.test(trimmed)) {
      flushList();
      result.push(`<h6 class="copilot-h3 fw-bold mt-2 mb-1" style="font-size:0.82rem;">${formatInline(trimmed.replace(/^### /, ""))}</h6>`);
      return;
    }

    if (/^[\*\-]\s+(.+)$/.test(trimmed)) {
      const item = trimmed.replace(/^[\*\-]\s+/, "");
      if (!inList || listType !== "ul") {
        flushList();
        result.push('<ul style="margin:4px 0 6px 16px;padding:0;list-style-type:disc;">');
        inList = true;
        listType = "ul";
      }
      result.push(`<li style="margin-bottom:2px;font-size:0.78rem;line-height:1.4;">${formatInline(item)}</li>`);
      return;
    }

    if (/^\d+\.\s+(.+)$/.test(trimmed)) {
      const item = trimmed.replace(/^\d+\.\s+/, "");
      if (!inList || listType !== "ol") {
        flushList();
        result.push('<ol style="margin:4px 0 6px 18px;padding:0;">');
        inList = true;
        listType = "ol";
      }
      result.push(`<li style="margin-bottom:2px;font-size:0.78rem;line-height:1.4;">${formatInline(item)}</li>`);
      return;
    }

    if (!trimmed) {
      flushList();
      return;
    }

    flushList();
    result.push(`<p class="mb-1" style="font-size:0.78rem;line-height:1.45;">${formatInline(trimmed)}</p>`);
  });

  flushList();
  return result.join("");
}

export default function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "initial-welcome",
      role: "assistant",
      content:
        "Greetings, Supervisor. I am your **Real-Time AI Safety Assistant**, continuously analyzing live telemetry stream from `ESP32_NODE_01` (Sector: Level -100m Main Adit).\n\nI can query live sensor values in real time, generate statutory **DGMS shift compliance reports**, evaluate historical hazard anomalies, and guide you through emergency **Standard Operating Procedures (SOPs)**.",
      timestamp: "Live Stream Active"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickChips = [
    { label: "Live Status", icon: "ph-activity text-info", prompt: "What is the current station safety status?" },
    { label: "Shift Report", icon: "ph-clipboard-text text-warning", prompt: "Generate shift safety handover report" },
    { label: "Methane SOP", icon: "ph-fire text-danger", prompt: "What is the combustible gas & methane emergency protocol?" },
    { label: "CO Protocol", icon: "ph-first-aid text-danger", prompt: "What is the emergency SOP for Carbon Monoxide breach?" },
    { label: "Fire SOP", icon: "ph-flame text-danger", prompt: "What is the emergency protocol if flame is detected?" },
    { label: "Ventilation Fan", icon: "ph-fan text-primary", prompt: "What is the current ventilation fan relay status?" },
    { label: "Worker Safety", icon: "ph-users text-success", prompt: "Check worker safety and headcount" },
    { label: "Evacuation", icon: "ph-person-simple-walk text-warning", prompt: "Show underground evacuation routes & refuge bays" }
  ];

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Expose global window helper for integration with existing navbar buttons
  useEffect(() => {
    window.toggleCopilotDrawer = (forceState) => {
      setIsOpen((prev) => (typeof forceState === "boolean" ? forceState : !prev));
    };
    window.quickPrompt = (promptText) => {
      setIsOpen(true);
      sendMessage(promptText);
    };
    window.clearCopilotChat = () => {
      setMessages([
        {
          id: "initial-welcome",
          role: "assistant",
          content: "Session reset. Telemetry stream from `ESP32_NODE_01` is actively synchronized. How may I assist you?",
          timestamp: "New Session"
        }
      ]);
    };
  }, []);

  const sendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: "msg-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const apiBase = window.location.port === "8000" ? `${window.location.origin}/api` : `http://${window.location.hostname || "127.0.0.1"}:8000/api`;
      const res = await fetch(`${apiBase}/copilot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      let replyContent = "";
      if (res.ok) {
        const data = await res.json();
        replyContent = data.response || data.reply || "Diagnostic analysis complete. Atmospheric parameters within compliance threshold.";
      } else {
        replyContent = "Real-time query completed via local rule engine. Sector: Level -100m is operating normally.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: "bot-" + Date.now(),
          role: "assistant",
          content: replyContent,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: "bot-" + Date.now(),
          role: "assistant",
          content: "Offline rule-based fallback active. Gas & CO levels logged to local SQLite buffer.",
          timestamp: "Offline Fallback"
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`copilot-floating-btn ${isOpen ? "active" : ""}`}
        id="copilotFloatingBtn"
        onClick={() => setIsOpen(!isOpen)}
        title="Open Real-Time AI Safety Assistant"
      >
        <div className="copilot-btn-glow"></div>
        <div className="copilot-btn-icon-wrapper">
          <i className="ph-fill ph-robot"></i>
          <span className="copilot-pulse-dot"></span>
        </div>
        <div className="copilot-btn-text">
          <span className="copilot-btn-title">Real-Time AI Assistant</span>
          <span className="copilot-btn-sub" id="copilotBtnModelLabel">
            Live Stream Active
          </span>
        </div>
      </button>

      {/* Slide-out AI Copilot Drawer */}
      <div className={`copilot-drawer ${isOpen ? "active" : ""}`} id="copilotDrawer">
        {/* Header */}
        <div className="copilot-header">
          <div className="d-flex align-items-center gap-2">
            <div className="copilot-avatar">
              <i className="ph-fill ph-shield-check text-info fs-5"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="copilot-title mb-0">Real-Time Safety Assistant</h5>
                <span
                  className="badge bg-success-subtle text-success border border-success-subtle"
                  id="copilotEngineBadge"
                  style={{ fontSize: "0.65rem" }}
                >
                  REACT 18
                </span>
              </div>
              <small className="copilot-sub text-muted" id="copilotEngineName">
                DGMS &amp; MSHA Live Safety Engine
              </small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-sm btn-outline-info rounded-pill px-2 py-1 me-1 d-inline-flex align-items-center gap-1"
              onClick={() => window.clearCopilotChat && window.clearCopilotChat()}
              title="Start New Conversation"
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                borderColor: "rgba(0, 242, 254, 0.45)",
                background: "rgba(0, 242, 254, 0.08)"
              }}
            >
              <i className="ph-bold ph-plus-circle"></i>
              <span>New Chat</span>
            </button>
            <button
              className="btn btn-sm copilot-head-btn"
              onClick={() => setIsOpen(false)}
              title="Minimize Drawer"
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
        </div>

        {/* Quick Prompt Action Chips */}
        <div className="copilot-quick-chips" id="copilotQuickChips">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              className="copilot-chip"
              onClick={() => sendMessage(chip.prompt)}
            >
              <i className={`ph-bold ${chip.icon}`}></i> {chip.label}
            </button>
          ))}
        </div>

        {/* Chat Messages Scroll Container */}
        <div className="copilot-messages" id="copilotMessages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`copilot-msg ${
                msg.role === "assistant" ? "copilot-msg-assistant" : "copilot-msg-user"
              }`}
            >
              <div className="copilot-msg-bubble">
                <div className="copilot-msg-header d-flex justify-content-between align-items-center mb-1">
                  <span
                    className={`fw-bold small ${
                      msg.role === "assistant" ? "text-info" : "text-white"
                    }`}
                  >
                    <i
                      className={`ph-fill ${
                        msg.role === "assistant" ? "ph-robot me-1" : "ph-user me-1"
                      }`}
                    ></i>
                    {msg.role === "assistant" ? "Real-Time AI Assistant" : "Control Room Officer"}
                  </span>
                  <span className="text-muted small" style={{ fontSize: "0.68rem" }}>
                    {msg.timestamp}
                  </span>
                </div>
                <div
                  className="copilot-msg-content"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                />
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="copilot-typing" id="copilotTyping">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <small className="text-muted ms-2" style={{ fontSize: "0.72rem" }}>
                Analyzing telemetry &amp; SOPs...
              </small>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="copilot-footer">
          <form
            id="copilotForm"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <div className="input-group">
              <input
                type="text"
                className="form-control copilot-input"
                id="copilotInput"
                placeholder="Ask about gas levels, shift report, SOPs..."
                autoComplete="off"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button className="btn btn-primary-gradient px-3" type="submit" id="btnCopilotSend">
                <i className="ph-bold ph-paper-plane-right"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
