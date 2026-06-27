import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function Layout({ activePage, onPageChange, user, onLogout, children, status }) {
  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onPageChange={onPageChange} user={user} onLogout={onLogout} />
      
      <div className="main-content">
        <Header user={user} />
        
        {status && (
          <div className="status-bar">
            <p>{status}</p>
          </div>
        )}

        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
}
