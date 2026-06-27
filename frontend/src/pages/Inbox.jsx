import React, { useState } from "react";
import { Mic, Plus, Sparkles, CheckCircle2, Square, Upload } from "lucide-react";

export function Inbox({
  transcriptText,
  setTranscriptText,
  recording,
  onStartRecording,
  onStopRecording,
  onSaveTranscript,
  transcripts,
  activeTranscriptId,
  setActiveTranscriptId,
  onExtractEvents,
  onGenerateTodos,
  events,
  loading
}) {
  const [uploadInput, setUploadInput] = useState(null);

  return (
    <section className="page">
      <div style={{ marginBottom: "24px" }}>
        <h2>Daily Reflection & Inbox</h2>
        <p className="muted">Record your thoughts, upload audio, or type reflections. The AI will extract todos and events.</p>
      </div>

      {/* Reflection Input */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
        <h3>Today's Reflection</h3>
        <textarea
          value={transcriptText}
          onChange={(e) => setTranscriptText(e.target.value)}
          placeholder="Type, paste, or record today's activities, thoughts, and key moments..."
          style={{ marginBottom: "16px" }}
        />

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={recording ? onStopRecording : onStartRecording} className={recording ? "primary" : ""}>
            {recording ? <Square size={16} /> : <Mic size={16} />}
            {recording ? "Stop Recording" : "Record Voice"}
          </button>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 16px", minHeight: "42px", border: "1px solid var(--border-color)", borderRadius: "10px", background: "rgba(255, 255, 255, 0.04)", cursor: "pointer", transition: "all 0.25s ease" }}>
            <Upload size={16} />
            Upload Audio
            <input type="file" accept="audio/*" style={{ display: "none" }} ref={el => setUploadInput(el)} />
          </label>
          <button className="primary" disabled={!transcriptText.trim()} onClick={onSaveTranscript}>
            <Plus size={16} /> Save Transcript
          </button>
        </div>
      </div>

      {/* Saved Transcripts & AI Analysis */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
        <div>
          {transcripts.length > 0 ? (
            <div>
              <h3 style={{ marginBottom: "16px" }}>Saved Transcripts</h3>
              <select
                value={activeTranscriptId}
                onChange={(e) => setActiveTranscriptId(e.target.value)}
                style={{ marginBottom: "16px" }}
              >
                <option value="">Select a transcript...</option>
                {transcripts.map((item) => (
                  <option key={item._id} value={item._id}>
                    {new Date(item.createdAt).toLocaleString()}
                  </option>
                ))}
              </select>

              {activeTranscriptId && (
                <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                  <button disabled={!activeTranscriptId} onClick={onExtractEvents}>
                    <Sparkles size={16} /> Extract Events
                  </button>
                  <button className="primary" disabled={!activeTranscriptId} onClick={onGenerateTodos}>
                    <CheckCircle2 size={16} /> Generate Todos
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="muted">No transcripts yet. Record or save one to get started.</p>
          )}

          {events.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <h3>Extracted Events</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {events.map((event, index) => (
                  <div key={index} style={{ padding: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                    <p style={{ margin: "0", fontWeight: "500", fontSize: "14px" }}>{event.eventType}</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>{event.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px", height: "fit-content", position: "sticky", top: "100px" }}>
          <h3>Recording Tips</h3>
          <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "13px", color: "var(--text-secondary)" }}>
            <li>Speak naturally and clearly</li>
            <li>Include todos and events</li>
            <li>Mention people and dates</li>
            <li>Note your priorities</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
