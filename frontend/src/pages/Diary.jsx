import React from "react";
import { Edit3, Sparkles, Save } from "lucide-react";

export function Diary({
  diary,
  setDiary,
  diaryEditing,
  setDiaryEditing,
  onGenerateDiary,
  onConfirmDiary,
  dailyStats
}) {
  return (
    <section className="page">
      <div style={{ marginBottom: "24px" }}>
        <h2>Daily Diary</h2>
        <p className="muted">Reflect on your day and capture key moments. Your diary is grounded in your actual activities and todos.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
        {/* Diary Entry */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "24px" }}>
          {diaryEditing ? (
            <>
              <h3 style={{ marginTop: "0" }}>Edit Entry</h3>
              <textarea
                value={diary}
                onChange={(e) => setDiary(e.target.value)}
                placeholder="Write your thoughts about today. What went well? What could be improved? What did you learn?"
                style={{ marginBottom: "16px", minHeight: "300px" }}
              />
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={onGenerateDiary}>
                  <Sparkles size={16} /> Generate Draft
                </button>
                <button className="primary" disabled={!diary.trim()} onClick={onConfirmDiary}>
                  <Save size={16} /> Save Diary
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "15px", lineHeight: "1.6", color: "var(--text-primary)", marginBottom: "20px", minHeight: "200px" }}>
                {diary || <p style={{ color: "var(--text-secondary)" }}>No diary entry yet.</p>}
              </div>
              <button onClick={() => setDiaryEditing(true)}>
                <Edit3 size={16} /> Edit Entry
              </button>
            </>
          )}
        </div>

        {/* Stats Sidebar */}
        <div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ marginTop: "0" }}>Today's Stats</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p style={{ margin: "0", fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Time Tracked</p>
                <p style={{ margin: "8px 0 0 0", fontSize: "24px", fontWeight: "700", color: "var(--color-primary)" }}>
                  {dailyStats?.trackedMinutes || 0}
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)", marginLeft: "4px" }}>min</span>
                </p>
              </div>
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <p style={{ margin: "0", fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Tasks Done</p>
                <p style={{ margin: "8px 0 0 0", fontSize: "24px", fontWeight: "700", color: "var(--color-primary)" }}>
                  {dailyStats?.completedTasks || 0}
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)", marginLeft: "4px" }}>/ {dailyStats?.totalTasks || 0}</span>
                </p>
              </div>
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <p style={{ margin: "0", fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Completion Rate</p>
                <p style={{ margin: "8px 0 0 0", fontSize: "24px", fontWeight: "700", color: "var(--color-primary)" }}>
                  {dailyStats?.completionRate || 0}%
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px", padding: "16px" }}>
            <p style={{ margin: "0", fontSize: "12px", color: "var(--text-secondary)" }}>
              Your diary entries are grounded in your actual activities, reflecting what you really did today.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
