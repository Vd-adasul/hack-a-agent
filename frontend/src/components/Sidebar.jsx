import React, { useState } from "react";
import { Menu, X, Home, Inbox, CheckCircle2, Clock, BookOpen, Brain, Settings, LogOut } from "lucide-react";

export function Sidebar({ activePage, onPageChange, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const pages = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "inbox", label: "Inbox", icon: Inbox },
    { id: "tasks", label: "Tasks", icon: CheckCircle2 },
    { id: "schedule", label: "Schedule", icon: Clock },
    { id: "diary", label: "Diary", icon: BookOpen },
    { id: "memory", label: "Memory", icon: Brain }
  ];

  const handlePageChange = (pageId) => {
    onPageChange(pageId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger menu button (mobile only) */}
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay (mobile) */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>PCA</h2>
          <button className="close-sidebar" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {pages.map(page => {
            const Icon = page.icon;
            return (
              <button
                key={page.id}
                className={`nav-item ${activePage === page.id ? "active" : ""}`}
                onClick={() => handlePageChange(page.id)}
              >
                <Icon size={18} />
                <span>{page.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            {user && <p className="user-name">{user.name}</p>}
          </div>
          <button className="nav-item" onClick={() => handlePageChange("settings")}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="nav-item" onClick={onLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
