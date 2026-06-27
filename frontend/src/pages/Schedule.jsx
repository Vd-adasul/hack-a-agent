import React, { useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { formatTime, getEisenhowerQuadrant } from "../utils/api";

export function Schedule({ timeBlocks, onDeleteBlock, onAddBlock, eisenhowerStats }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ startTime: "", endTime: "", activity: "", category: "General" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.startTime && formData.endTime && formData.activity) {
      onAddBlock(formData.startTime, formData.endTime);
      setFormData({ startTime: "", endTime: "", activity: "", category: "General" });
      setShowForm(false);
    }
  };

  return (
    <section className="page">
      <div style={{ marginBottom: "24px" }}>
        <h2>Daily Schedule</h2>
        <p className="muted">Track your time blocks and see how your day is allocated.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
        {/* Timeline */}
        <div>
          {timeBlocks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <Clock size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p style={{ color: "var(--text-secondary)" }}>No time blocks logged yet.</p>
              <button className="primary" onClick={() => setShowForm(true)} style={{ marginTop: "12px" }}>
                <Plus size={16} /> Add Block
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {timeBlocks.map((block) => {
                const quadrant = getEisenhowerQuadrant(block.importance, block.urgency);
                const quadrantColors = {
                  q1: "rgba(248, 113, 113, 0.1)",
                  q2: "rgba(129, 140, 248, 0.1)",
                  q3: "rgba(251, 191, 36, 0.1)",
                  q4: "rgba(156, 163, 175, 0.1)"
                };
                const quadrantBorders = {
                  q1: "rgba(248, 113, 113, 0.3)",
                  q2: "rgba(129, 140, 248, 0.3)",
                  q3: "rgba(251, 191, 36, 0.3)",
                  q4: "rgba(156, 163, 175, 0.3)"
                };

                return (
                  <div
                    key={block._id}
                    style={{
                      background: quadrantColors[quadrant],
                      border: `1px solid ${quadrantBorders[quadrant]}`,
                      borderRadius: "8px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--color-primary)" }}>
                          {block.startTime} - {block.endTime}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                          {block.category}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "500" }}>{block.activity}</p>
                      <p style={{ margin: "0", fontSize: "12px", color: "var(--text-secondary)" }}>
                        {block.importance === "high" && block.urgency === "high" && "Urgent & Important (Q1)"}
                        {block.importance === "high" && block.urgency !== "high" && "Important, Not Urgent (Q2)"}
                        {block.importance !== "high" && block.urgency === "high" && "Urgent, Not Important (Q3)"}
                        {block.importance !== "high" && block.urgency !== "high" && "Not Urgent & Not Important (Q4)"}
                      </p>
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => onDeleteBlock(block._id)}
                      title="Delete block"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Add Block Form */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <h3>Add Block</h3>
            {showForm ? (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)" }}>Start</span>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    style={{ marginTop: "4px" }}
                  />
                </label>
                <label>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)" }}>End</span>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    style={{ marginTop: "4px" }}
                  />
                </label>
                <label>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)" }}>Activity</span>
                  <input
                    value={formData.activity}
                    onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                    placeholder="What?"
                    required
                    style={{ marginTop: "4px" }}
                  />
                </label>
                <button type="submit" className="primary" style={{ marginTop: "8px" }}>
                  <Plus size={14} /> Save
                </button>
              </form>
            ) : (
              <button className="primary" onClick={() => setShowForm(true)} style={{ width: "100%" }}>
                <Plus size={16} /> Add Block
              </button>
            )}
          </div>

          {/* Eisenhower Matrix */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px" }}>
            <h3>Eisenhower Matrix</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { key: "q1", label: "Q1", color: "var(--color-q1)", desc: "Urgent & Imp" },
                { key: "q2", label: "Q2", color: "var(--color-q2)", desc: "Important" },
                { key: "q3", label: "Q3", color: "var(--color-q3)", desc: "Urgent" },
                { key: "q4", label: "Q4", color: "var(--color-q4)", desc: "Neither" }
              ].map(q => (
                <div key={q.key} style={{ textAlign: "center", padding: "12px", borderRadius: "8px", background: `${q.color}20`, border: `1px solid ${q.color}40` }}>
                  <p style={{ margin: "0", fontSize: "12px", color: "var(--text-secondary)" }}>{q.desc}</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "700", color: q.color }}>
                    {eisenhowerStats[q.key] || 0}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px", padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
              <strong>Total:</strong> {eisenhowerStats.total * 30}min ({(eisenhowerStats.total * 0.5).toFixed(1)}h)
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
