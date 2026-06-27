import React from "react";
import { Search, Volume2 } from "lucide-react";

export function Memory({ question, setQuestion, answer, onAskMemory, onSpeakAnswer }) {
  return (
    <section className="page">
      <div style={{ marginBottom: "24px" }}>
        <h2>Personal Memory</h2>
        <p className="muted">Query your continuity memory. The AI searches across your reflections, diary, tasks, and logged events to answer questions about your past.</p>
      </div>

      {/* Query Input */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)" }}>Ask about your memory</span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="E.g., What did I promise Maria? What was my focus last Tuesday? Who did I meet with?"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && question.trim()) {
                onAskMemory();
              }
            }}
            style={{ fontSize: "15px" }}
          />
        </label>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="primary" disabled={!question.trim()} onClick={onAskMemory}>
            <Search size={16} /> Query Memory
          </button>
          <button disabled={!answer} onClick={onSpeakAnswer}>
            <Volume2 size={16} /> Read Aloud
          </button>
        </div>
      </div>

      {/* Answer Display */}
      {answer && (
        <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.1) 100%)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ marginTop: "0", marginBottom: "16px" }}>Memory Answer</h3>
          <div style={{ fontSize: "15px", lineHeight: "1.6", color: "var(--text-primary)" }}>
            {answer}
          </div>
        </div>
      )}

      {/* Tips */}
      {!answer && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ marginTop: "0" }}>Try Asking</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            {[
              "What projects am I working on?",
              "Who did I meet with recently?",
              "What were my priorities this week?",
              "What time do I usually exercise?",
              "What was I worried about last month?"
            ].map((tip, index) => (
              <button
                key={index}
                onClick={() => setQuestion(tip)}
                style={{
                  padding: "12px",
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "var(--text-secondary)",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.05)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {tip}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
