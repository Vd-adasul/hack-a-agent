import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, Clock, Info } from "lucide-react";
import { formatTime, getEisenhowerQuadrant } from "../utils/api";

function ScheduleRow({ slot, block, onAddBlock, onUpdateBlock, onDeleteBlock }) {
  const [activity, setActivity] = useState(block ? block.activity : "");
  const [important, setImportant] = useState(block ? block.importance === "high" : false);
  const [urgent, setUrgent] = useState(block ? block.urgency === "high" : false);
  const [isFocused, setIsFocused] = useState(false);

  // Sync state if block changes externally, but ONLY if we are not actively typing in it
  useEffect(() => {
    if (!isFocused) {
      setActivity(block ? block.activity : "");
      setImportant(block ? block.importance === "high" : false);
      setUrgent(block ? block.urgency === "high" : false);
    }
  }, [block, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const trimmed = activity.trim();
    if (!block && trimmed) {
      // Create new
      onAddBlock({
        startTime: slot.startTime,
        endTime: slot.endTime,
        activity: trimmed,
        importance: important ? "high" : "low",
        urgency: urgent ? "high" : "low",
        category: "General"
      });
    } else if (block && !trimmed) {
      // Delete existing
      onDeleteBlock(block._id, true);
    } else if (block && trimmed && (
      trimmed !== block.activity || 
      (important ? "high" : "low") !== block.importance ||
      (urgent ? "high" : "low") !== block.urgency
    )) {
      // Update existing
      onUpdateBlock(block._id, {
        activity: trimmed,
        importance: important ? "high" : "low",
        urgency: urgent ? "high" : "low"
      });
    }
  };

  const handleCheckboxChange = (field, checked) => {
    if (field === 'important') setImportant(checked);
    if (field === 'urgent') setUrgent(checked);
    
    const newImportant = field === 'important' ? checked : important;
    const newUrgent = field === 'urgent' ? checked : urgent;
    
    const trimmed = activity.trim();
    if (!block && trimmed) {
      onAddBlock({
        startTime: slot.startTime,
        endTime: slot.endTime,
        activity: trimmed,
        importance: newImportant ? "high" : "low",
        urgency: newUrgent ? "high" : "low",
        category: "General"
      });
    } else if (block && trimmed) {
      onUpdateBlock(block._id, {
        importance: newImportant ? "high" : "low",
        urgency: newUrgent ? "high" : "low"
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur(); // Trigger blur to save
    }
  };

  // Visual classes based on block status
  let rowClass = "spreadsheet-row";
  if (block) rowClass += " has-data";
  if (isFocused) rowClass += " is-focused";

  return (
    <div className={rowClass}>
      <div className="spreadsheet-cell time-cell">
        <span className="time-text">{slot.startTime}</span>
      </div>
      <div className="spreadsheet-cell task-cell">
        <input 
          type="text" 
          value={activity} 
          onChange={(e) => setActivity(e.target.value)} 
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder=" "
          className="spreadsheet-input"
        />
      </div>
      <div className="spreadsheet-cell checkbox-cell" title="Urgent">
        <label className="tactical-checkbox">
          <input 
            type="checkbox" 
            checked={urgent} 
            onChange={(e) => handleCheckboxChange('urgent', e.target.checked)} 
          />
          <span className="checkmark"></span>
        </label>
      </div>
      <div className="spreadsheet-cell checkbox-cell" title="Important">
        <label className="tactical-checkbox">
          <input 
            type="checkbox" 
            checked={important} 
            onChange={(e) => handleCheckboxChange('important', e.target.checked)} 
          />
          <span className="checkmark"></span>
        </label>
      </div>
    </div>
  );
}

export function Schedule({ timeBlocks, timelineSlots, onDeleteBlock, onAddBlock, onUpdateBlock, eisenhowerStats }) {
  // We need to scroll to current time roughly
  const gridRef = useRef(null);

  useEffect(() => {
    if (gridRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      // Calculate scroll position (roughly 42px per row, 48 rows. 00:00 starts at row 0)
      const scrollPosition = (currentHour * 2) * 42; 
      // Subtract a little so current time is roughly in middle
      gridRef.current.scrollTop = Math.max(0, scrollPosition - 200);
    }
  }, []);

  return (
    <section className="page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: "24px" }}>
        <h2>Daily Planner</h2>
        <p className="muted">Click any time slot to edit. Changes save automatically.</p>
      </div>

      <div className="schedule-split-layout" style={{ flex: 1, overflow: 'hidden' }}>
        {/* Spreadsheet Main Grid */}
        <div className="spreadsheet-container" ref={gridRef}>
          <div className="spreadsheet-header">
            <div className="spreadsheet-th time-th">Time</div>
            <div className="spreadsheet-th task-th">Task</div>
            <div className="spreadsheet-th checkbox-th">Urg</div>
            <div className="spreadsheet-th checkbox-th">Imp</div>
          </div>
          <div className="spreadsheet-body">
            {timelineSlots && timelineSlots.map((slot) => {
              const block = timeBlocks.find(b => b.startTime === slot.startTime);
              return (
                <ScheduleRow 
                  key={slot.startTime} 
                  slot={slot} 
                  block={block}
                  onAddBlock={onAddBlock}
                  onUpdateBlock={onUpdateBlock}
                  onDeleteBlock={onDeleteBlock}
                />
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="schedule-sidebar-column">
          {/* Eisenhower Matrix */}
          <div className="dashboard-card" style={{ padding: "20px" }}>
            <div className="card-header" style={{ marginBottom: "16px" }}>
              <h3>Eisenhower Matrix</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { key: "q1", label: "Q1", color: "var(--color-q1)", desc: "Urgent & Imp" },
                { key: "q2", label: "Q2", color: "var(--color-q2)", desc: "Important" },
                { key: "q3", label: "Q3", color: "var(--color-q3)", desc: "Urgent" },
                { key: "q4", label: "Q4", color: "var(--color-q4)", desc: "Neither" }
              ].map(q => (
                <div key={q.key} style={{ textAlign: "center", padding: "12px", borderRadius: "4px", background: `rgba(255,255,255,0.02)`, border: `1px solid var(--border-color)` }}>
                  <p style={{ margin: "0", fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>{q.desc}</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "700", color: q.color, fontFamily: "var(--font-mono)" }}>
                    {eisenhowerStats[q.key] || 0}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", borderRadius: "4px", fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              <strong>Total Booked:</strong> {eisenhowerStats.total * 30}min ({(eisenhowerStats.total * 0.5).toFixed(1)}h)
            </div>
          </div>
          
          <div className="dashboard-card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <Info size={18} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Enter tasks seamlessly. Clearing a task automatically frees the block. Checking urgency or importance instantly updates your Eisenhower Stats.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
