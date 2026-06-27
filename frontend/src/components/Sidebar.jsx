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
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Brain size={18} style={{ color: "var(--color-primary)" }} /> 
              <span style={{ letterSpacing: "1.5px", fontWeight: "800" }}>CONTINUITY</span>
            </h2>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "1px" }}>
              PCA_TERMINAL // V1.0.4
            </span>
          </div>
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
          <div className="user-info" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {user && (
              <>
                <p className="user-name">{user.name}</p>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  ID: {user.id ? user.id.slice(0, 8) : "GUEST"}
                </span>
              </>
            )}
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
