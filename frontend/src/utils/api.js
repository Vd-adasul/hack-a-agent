const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const request = async (path, { token, method = "GET", body } = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const getLocalDateString = (d = new Date()) => {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
};

export const getRelativeDateString = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return getLocalDateString(d);
};

export const shiftDate = (dateStr, direction) => {
  const parts = dateStr.split("-");
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + direction);
  return getLocalDateString(d);
};

export const formatTime = (time) => {
  const parts = time.split(":");
  const h = parseInt(parts[0]);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${parts[1]} ${ampm}`;
};

export const getPriorityClass = (priority) => {
  const map = {
    high: "priority-high",
    medium: "priority-medium",
    low: "priority-low"
  };
  return map[priority] || "priority-medium";
};

export const getEisenhowerQuadrant = (importance, urgency) => {
  if (importance === "high" && urgency === "high") return "q1";
  if (importance === "high" && urgency !== "high") return "q2";
  if (importance !== "high" && urgency === "high") return "q3";
  return "q4";
};

export const getQuadrantLabel = (importance, urgency) => {
  if (importance === "high" && urgency === "high") return "Urgent & Important (Q1)";
  if (importance === "high" && urgency !== "high") return "Important, Not Urgent (Q2)";
  if (importance !== "high" && urgency === "high") return "Urgent, Not Important (Q3)";
  return "Not Urgent & Not Important (Q4)";
};
