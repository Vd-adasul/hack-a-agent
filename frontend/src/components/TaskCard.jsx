import React from "react";
import { Trash2 } from "lucide-react";
import { getPriorityClass } from "../utils/api";

export function TaskCard({ todo, onToggle, onDelete }) {
  return (
    <div className={`task-card ${todo.status === "completed" ? "completed" : ""}`}>
      <input
        type="checkbox"
        checked={todo.status === "completed"}
        onChange={() => onToggle(todo._id, todo.status)}
        className="task-checkbox"
      />
      <div className="task-content">
        <span className="task-title">{todo.title}</span>
        {todo.description && <p className="task-description">{todo.description}</p>}
      </div>
      <div className="task-meta">
        <span className={`priority-badge ${getPriorityClass(todo.priority)}`}>
          {todo.priority}
        </span>
        {todo.dueDate && <span className="due-date">{todo.dueDate}</span>}
      </div>
      <button className="delete-button" onClick={() => onDelete(todo._id)} title="Delete">
        <Trash2 size={16} />
      </button>
    </div>
  );
}
