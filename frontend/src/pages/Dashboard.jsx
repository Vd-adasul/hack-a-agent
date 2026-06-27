import React, { useEffect, useState } from "react";
import { Mic, Sparkles, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { MiniCalendar } from "../components/MiniCalendar";
import { useDateContext } from "../hooks/useDateContext.jsx";
import { useApi } from "../hooks/useApi.jsx";
import { request } from "../utils/api";

export function Dashboard({ token, todos, timeBlocks, dailyStats, onReflectionClick }) {
  const { activeDate } = useDateContext();
  const { makeRequest } = useApi(token);

  // Get today's high-priority todos
  const todayHighPriority = todos
    .filter(t => t.status !== "completed" && t.priority === "high")
    .slice(0, 5);

  // Get today's scheduled time blocks
  const todayScheduled = timeBlocks.slice(0, 5);

  // Calculate completion percentage
  const completedTodosCount = todos.filter(t => t.status === "completed").length;
  const completionRate = todos.length > 0 ? Math.round((completedTodosCount / todos.length) * 100) : 0;

  return (
    <section className="page dashboard">
      <div className="dashboard-grid">
        {/* Left: Mini Calendar */}
        <div className="dashboard-sidebar">
          <MiniCalendar />
        </div>

        {/* Right: Daily Overview */}
        <div className="dashboard-main">
          {/* Quick Reflection Entry */}
          <div className="quick-reflection-card">
            <div className="card-header">
              <h3>Quick Reflection</h3>
            </div>
            <div className="reflection-actions">
              <button className="primary" onClick={onReflectionClick}>
                <Mic size={18} />
                Record Reflection
              </button>
              <button className="secondary">
                <Sparkles size={18} />
                AI Suggestions
              </button>
            </div>
          </div>

          {/* Today's Priorities */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Today's Priorities</h3>
              <span className="badge">{todayHighPriority.length}</span>
            </div>
            {todayHighPriority.length === 0 ? (
              <p className="empty-state">No high-priority tasks for today</p>
            ) : (
              <div className="priorities-list">
                {todayHighPriority.map(todo => (
                  <div key={todo._id} className="priority-item">
                    <input type="checkbox" disabled />
                    <span className="priority-title">{todo.title}</span>
                    <span className="priority-badge high">High</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Schedule */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Scheduled Today</h3>
              <span className="badge">{todayScheduled.length}</span>
            </div>
            {todayScheduled.length === 0 ? (
              <p className="empty-state">No time blocks scheduled</p>
            ) : (
              <div className="schedule-list">
                {todayScheduled.map(block => (
                  <div key={block._id} className="schedule-item">
                    <span className="schedule-time">{block.startTime}</span>
                    <span className="schedule-activity">{block.activity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Stats */}
          <div className="dashboard-stats">
            <div className="stat-item">
              <div className="stat-value">{dailyStats?.trackedMinutes || 0}</div>
              <div className="stat-label">Minutes Tracked</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{completionRate}%</div>
              <div className="stat-label">Completion Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{completedTodosCount}/{todos.length}</div>
              <div className="stat-label">Tasks Done</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
