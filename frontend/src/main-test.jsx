import React from "react";
import { createRoot } from "react-dom/client";

console.log("[v0] Test app starting");

function TestApp() {
  return (
    <div style={{ padding: "20px", background: "#f0f0f0" }}>
      <h1>Test React App</h1>
      <p>If you see this, React is working!</p>
    </div>
  );
}

console.log("[v0] Creating root");
const root = createRoot(document.getElementById("root"));
console.log("[v0] Rendering");
root.render(<TestApp />);
console.log("[v0] Done");
