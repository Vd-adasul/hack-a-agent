import React, { useState } from "react";
import { Plus, CheckCircle2, Sparkles } from "lucide-react";
import { TaskCard } from "../components/TaskCard";

export function Tasks({
  todos,
  suggestedTodos,
  todoForm,
  setTodoForm,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onAcceptSuggested,
  onRejectSuggested,
  activeDate
}) {
  const [filter, setFilter] = useState("all");

  const filteredTodos = todos.filter(todo => {
    if (filter === "completed") return todo.status === "completed";
    if (filter === "pending") return todo.status !== "completed";
    return true;
  });

  return (
    <section className="page">
      <div style={{ marginBottom: "24px" }}>
        <h2>Tasks & Commitments</h2>
        <p className="muted">Manage your daily tasks. Create manually or extract from reflections using AI.</p>
      </div>

      {suggestedTodos.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.1) 100%)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} style={{ color: "var(--color-accent)" }} />
              AI Suggested Todos ({suggestedTodos.length})
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            {suggestedTodos.map((todo, index) => (
              <div key={index} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ margin: "0", fontWeight: "500", fontSize: "14px" }}>{todo.title}</p>
                {todo.description && <p style={{ margin: "0", fontSize: "12px", color: "var(--text-secondary)" }}>{todo.description}</p>}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="primary" onClick={() => onAcceptSuggested(index)} style={{ flex: 1, minHeight: "36px" }}>Accept</button>
                  <button onClick={() => onRejectSuggested(index)} style={{ flex: 1, minHeight: "36px" }}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }}>
        {/* Task List */}
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                background: filter === "all" ? "var(--color-primary)" : "transparent",
                color: filter === "all" ? "#000" : "var(--text-secondary)",
                border: filter === "all" ? "none" : "1px solid var(--border-color)"
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter("pending")}
              style={{
                background: filter === "pending" ? "var(--color-primary)" : "transparent",
                color: filter === "pending" ? "#000" : "var(--text-secondary)",
                border: filter === "pending" ? "none" : "1px solid var(--border-color)"
              }}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("completed")}
              style={{
                background: filter === "completed" ? "var(--color-primary)" : "transparent",
                color: filter === "completed" ? "#000" : "var(--text-secondary)",
                border: filter === "completed" ? "none" : "1px solid var(--border-color)"
              }}
            >
              Completed
            </button>
          </div>

          {filteredTodos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
              <CheckCircle2 size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p>No tasks yet. Create one to get started!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredTodos.map((todo) => (
                <TaskCard
                  key={todo._id}
                  todo={todo}
                  onToggle={(id, status) => onToggleTodo(id, status === "completed" ? "pending" : "completed")}
                  onDelete={onDeleteTodo}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Task Form */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px", height: "fit-content", position: "sticky", top: "100px" }}>
          <h3>Add Task</h3>
          <form onSubmit={onAddTodo} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Title</span>
              <input
                value={todoForm.title}
                onChange={(e) => setTodoForm({ ...todoForm, title: e.target.value })}
                placeholder="What do you need to do?"
                required
                style={{ marginTop: "4px" }}
              />
            </label>
            <label>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Description</span>
              <textarea
                value={todoForm.description}
                onChange={(e) => setTodoForm({ ...todoForm, description: e.target.value })}
                placeholder="Optional details..."
                style={{ marginTop: "4px", minHeight: "60px" }}
              />
            </label>
            <label>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Priority</span>
              <select
                value={todoForm.priority}
                onChange={(e) => setTodoForm({ ...todoForm, priority: e.target.value })}
                style={{ marginTop: "4px" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Due Date</span>
              <input
                type="date"
                value={todoForm.dueDate}
                onChange={(e) => setTodoForm({ ...todoForm, dueDate: e.target.value })}
                style={{ marginTop: "4px" }}
              />
            </label>
            <button type="submit" className="primary" style={{ marginTop: "8px" }}>
              <Plus size={16} /> Add Task
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
