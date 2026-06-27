import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { 
  Brain, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  LogOut, 
  MessageSquareText, 
  Mic, 
  Plus, 
  Sparkles, 
  Square, 
  Volume2,
  Trash2,
  X,
  Check,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle
} from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const request = async (path, { token, method = "GET", body } = {}) => {
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

// Safely get local YYYY-MM-DD string
const getLocalDateString = (d = new Date()) => {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
};

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const data = await request(path, { method: "POST", body: form });
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <form className="auth-panel" onSubmit={submit}>
        <Brain size={42} />
        <h1>Personal Continuity</h1>
        <p className="muted">Your voice-first continuity, memory & schedule tracking assistant</p>
        <div className="segmented">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
        </div>
        {mode === "register" && (
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}</button>
      </form>
    </main>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("pca_token") || "");
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [transcriptText, setTranscriptText] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [activeTranscriptId, setActiveTranscriptId] = useState("");
  const [suggestedTodos, setSuggestedTodos] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Date State & Switcher
  const [activeDate, setActiveDate] = useState(getLocalDateString());
  
  // Forms and details
  const [todoForm, setTodoForm] = useState({ title: "", description: "", priority: "medium", dueDate: "" });
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [diary, setDiary] = useState("");
  const [diaryConfirmed, setDiaryConfirmed] = useState(false);
  const [diaryEditing, setDiaryEditing] = useState(false);
  
  // Interactive Timeline Grid quick-add state
  const [editingSlot, setEditingSlot] = useState(null);
  const [quickAdd, setQuickAdd] = useState({ activity: "", category: "General", urgent: false, important: false });
  
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [dailyStats, setDailyStats] = useState(null);
  const [status, setStatus] = useState("");
  const [activePage, setActivePage] = useState("reflect");

  const authHeaders = useMemo(() => ({ token }), [token]);

  // Load all daily context for a given date
  const loadCore = async (dateStr = activeDate) => {
    if (!token) return;
    try {
      const [me, todoData, transcriptData, statsData, blocksData, diaryData] = await Promise.all([
        request("/api/auth/me", authHeaders),
        request("/api/todos", authHeaders),
        request("/api/transcripts", authHeaders),
        request(`/api/analytics/daily?date=${dateStr}`, authHeaders),
        request(`/api/timeblocks/day/${dateStr}`, authHeaders),
        request(`/api/diary/${dateStr}`, authHeaders).catch(() => ({ diary: null }))
      ]);
      setUser(me.user);
      setTodos(todoData.todos);
      setTranscripts(transcriptData.transcripts);
      setDailyStats(statsData);
      setTimeBlocks(blocksData.timeBlocks || []);
      
      if (diaryData?.diary) {
        setDiary(diaryData.diary.content);
        setDiaryConfirmed(diaryData.diary.confirmed);
        setDiaryEditing(!diaryData.diary.confirmed);
      } else {
        setDiary("");
        setDiaryConfirmed(false);
        setDiaryEditing(true);
      }
    } catch (err) {
      setStatus(err.message);
    }
  };

  useEffect(() => {
    loadCore(activeDate).catch((err) => {
      setStatus(err.message);
      if (err.message.toLowerCase().includes("token")) logout();
    });
    
    // Default todo form date to selected date
    setTodoForm(prev => ({ ...prev, dueDate: activeDate }));
  }, [token, activeDate]);

  const onAuth = (data) => {
    localStorage.setItem("pca_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("pca_token");
    setToken("");
    setUser(null);
  };

  // Switch Active Date
  const handleDateChange = (newDate) => {
    setActiveDate(newDate);
    setEditingSlot(null);
    setStatus("");
  };

  const getRelativeDateString = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return getLocalDateString(d);
  };

  // Date Navigation Helpers
  const shiftDay = (direction) => {
    const parts = activeDate.split("-");
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + direction);
    handleDateChange(getLocalDateString(d));
  };

  // Audio / STT transcript functions
  const saveTranscript = async () => {
    setStatus("Saving transcript...");
    try {
      const data = await request("/api/transcripts", { ...authHeaders, method: "POST", body: { text: transcriptText } });
      setTranscriptText("");
      setActiveTranscriptId(data.transcript._id);
      await loadCore(activeDate);
      setStatus("Transcript saved.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const transcribeBlob = async (blob, filename = "reflection.webm") => {
    setStatus("Transcribing audio...");
    try {
      const formData = new FormData();
      formData.append("audio", blob, filename);
      const response = await fetch(`${API_URL}/api/audio/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Transcription failed");
      setTranscriptText(data.text);
      setActiveTranscriptId(data.transcript._id);
      await loadCore(activeDate);
      setStatus("Audio transcribed and saved.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        await transcribeBlob(new Blob(chunks, { type: "audio/webm" }));
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setStatus("Recording...");
    } catch (err) {
      setStatus("Failed to access microphone: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    setRecording(false);
  };

  const uploadAudio = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await transcribeBlob(file, file.name);
    event.target.value = "";
  };

  const extractEvents = async () => {
    setStatus("Extracting events...");
    try {
      const data = await request("/api/events/extract", { ...authHeaders, method: "POST", body: { transcriptId: activeTranscriptId } });
      setEvents(data.events);
      setStatus("Events extracted.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const generateTodos = async () => {
    setStatus("Generating todo suggestions...");
    try {
      const data = await request("/api/todos/generate", { ...authHeaders, method: "POST", body: { transcriptId: activeTranscriptId } });
      setSuggestedTodos(data.todos || []);
      setStatus("Todo suggestions loaded! Check the Todos tab.");
      setActivePage("todos");
    } catch (err) {
      setStatus(err.message);
    }
  };

  // Todo items actions
  const addManualTodo = async (event) => {
    event.preventDefault();
    if (!todoForm.title.trim()) return;
    setStatus("Saving todo...");
    try {
      await request("/api/todos/confirm", {
        ...authHeaders,
        method: "POST",
        body: {
          todos: [{
            title: todoForm.title.trim(),
            description: todoForm.description.trim() || undefined,
            dueDate: todoForm.dueDate || undefined,
            priority: todoForm.priority || "medium"
          }]
        }
      });
      setTodoForm({ title: "", description: "", priority: "medium", dueDate: activeDate });
      await loadCore(activeDate);
      setStatus("Todo added.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const acceptSuggestedTodo = async (index) => {
    const todo = suggestedTodos[index];
    setStatus("Accepting todo...");
    try {
      await request("/api/todos/confirm", {
        ...authHeaders,
        method: "POST",
        body: {
          todos: [{
            title: todo.title,
            description: todo.description,
            dueDate: todo.dueDate || undefined,
            priority: todo.priority || "medium",
            transcriptId: activeTranscriptId
          }]
        }
      });
      setSuggestedTodos(prev => prev.filter((_, idx) => idx !== index));
      await loadCore(activeDate);
      setStatus("Suggested todo accepted and saved.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const rejectSuggestedTodo = (index) => {
    setSuggestedTodos(prev => prev.filter((_, idx) => idx !== index));
    setStatus("Suggested todo dismissed.");
  };

  const acceptAllSuggestedTodos = async () => {
    if (suggestedTodos.length === 0) return;
    setStatus("Accepting all suggested todos...");
    try {
      await request("/api/todos/confirm", {
        ...authHeaders,
        method: "POST",
        body: {
          todos: suggestedTodos.map(todo => ({
            title: todo.title,
            description: todo.description,
            dueDate: todo.dueDate || undefined,
            priority: todo.priority || "medium",
            transcriptId: activeTranscriptId
          }))
        }
      });
      setSuggestedTodos([]);
      await loadCore(activeDate);
      setStatus("All suggestions accepted and saved.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const dismissAllSuggestedTodos = () => {
    setSuggestedTodos([]);
    setStatus("Suggested todos dismissed.");
  };

  const updateTodo = async (id, patch) => {
    try {
      await request(`/api/todos/${id}`, { ...authHeaders, method: "PATCH", body: patch });
      await loadCore(activeDate);
    } catch (err) {
      setStatus(err.message);
    }
  };

  const deleteTodo = async (id) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;
    setStatus("Deleting todo...");
    try {
      await request(`/api/todos/${id}`, { ...authHeaders, method: "DELETE" });
      await loadCore(activeDate);
      setStatus("Todo deleted.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  // Timeline Schedule Slot functions
  const timelineSlots = useMemo(() => {
    const slots = [];
    let hour = 4;
    let min = 0;
    for (let i = 0; i < 48; i++) {
      const hStr = String(hour).padStart(2, "0");
      const mStr = String(min).padStart(2, "0");
      const startTime = `${hStr}:${mStr}`;
      
      let endHour = hour;
      let endMin = min + 30;
      if (endMin >= 60) {
        endHour = (endHour + 1) % 24;
        endMin = 0;
      }
      const ehStr = String(endHour).padStart(2, "0");
      const emStr = String(endMin).padStart(2, "0");
      const endTime = `${ehStr}:${emStr}`;
      
      slots.push({ startTime, endTime });
      
      min += 30;
      if (min >= 60) {
        hour = (hour + 1) % 24;
        min = 0;
      }
    }
    return slots;
  }, []);

  const addTimelineBlock = async (startTime, endTime) => {
    if (!quickAdd.activity.trim()) return;
    setStatus("Saving time block...");
    try {
      await request("/api/timeblocks", {
        ...authHeaders,
        method: "POST",
        body: {
          blockDate: activeDate,
          startTime,
          endTime,
          activity: quickAdd.activity.trim(),
          category: quickAdd.category || "General",
          importance: quickAdd.important ? "high" : "low",
          urgency: quickAdd.urgent ? "high" : "low"
        }
      });
      setQuickAdd({ activity: "", category: "General", urgent: false, important: false });
      setEditingSlot(null);
      await loadCore(activeDate);
      setStatus("Time block saved.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const deleteTimelineBlock = async (id) => {
    if (!confirm("Are you sure you want to delete this time block?")) return;
    setStatus("Deleting time block...");
    try {
      await request(`/api/timeblocks/${id}`, { ...authHeaders, method: "DELETE" });
      await loadCore(activeDate);
      setStatus("Time block deleted.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const toggleBlockImportance = async (id, currentVal) => {
    try {
      await request(`/api/timeblocks/${id}`, {
        ...authHeaders,
        method: "PATCH",
        body: { importance: currentVal === "high" ? "low" : "high" }
      });
      await loadCore(activeDate);
    } catch (err) {
      setStatus(err.message);
    }
  };

  const toggleBlockUrgency = async (id, currentVal) => {
    try {
      await request(`/api/timeblocks/${id}`, {
        ...authHeaders,
        method: "PATCH",
        body: { urgency: currentVal === "high" ? "low" : "high" }
      });
      await loadCore(activeDate);
    } catch (err) {
      setStatus(err.message);
    }
  };

  // Eisenhower Matrix Counts
  const eisenhowerStats = useMemo(() => {
    const stats = { q1: 0, q2: 0, q3: 0, q4: 0, total: 0 };
    timeBlocks.forEach(b => {
      stats.total++;
      const isImp = b.importance === "high";
      const isUrg = b.urgency === "high";
      if (isImp && isUrg) stats.q1++;
      else if (isImp && !isUrg) stats.q2++;
      else if (!isImp && isUrg) stats.q3++;
      else stats.q4++;
    });
    return stats;
  }, [timeBlocks]);

  // Diary Actions
  const generateDiary = async () => {
    setStatus("Generating diary draft...");
    try {
      const data = await request("/api/diary/generate", { ...authHeaders, method: "POST", body: { date: activeDate } });
      setDiary(data.diary.content);
      setDiaryConfirmed(false);
      setDiaryEditing(true);
      setStatus("Diary draft ready.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const confirmDiary = async () => {
    setStatus("Saving diary entry...");
    try {
      await request("/api/diary/confirm", { ...authHeaders, method: "POST", body: { diaryDate: activeDate, content: diary } });
      setDiaryConfirmed(true);
      setDiaryEditing(false);
      await loadCore(activeDate);
      setStatus("Diary confirmed and saved.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  // Memory query search
  const askMemory = async () => {
    setStatus("Searching memory...");
    try {
      const data = await request("/api/query", { ...authHeaders, method: "POST", body: { question } });
      setAnswer(data.answer);
      setStatus("Answer ready.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const speakAnswer = async () => {
    if (!answer) return;
    setStatus("Generating speech...");
    try {
      const response = await fetch(`${API_URL}/api/audio/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: answer })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Text-to-speech failed");
      }
      const blob = await response.blob();
      new Audio(URL.createObjectURL(blob)).play();
      setStatus("Playing answer.");
    } catch (error) {
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
        speechSynthesis.speak(new SpeechSynthesisUtterance(answer));
        setStatus("Playing answer with browser speech.");
      } else {
        setStatus(error.message);
      }
    }
  };

  const getPriorityBadgeClass = (priority) => {
    return `priority-badge ${priority || "medium"}`;
  };

  const formatTimeStr = (time) => {
    const parts = time.split(":");
    const h = parseInt(parts[0]);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${parts[1]} ${ampm}`;
  };

  if (!token) return <AuthScreen onAuth={onAuth} />;

  return (
    <main className="app-shell">
      <header>
        <div>
          <p className="eyebrow">Welcome{user ? `, ${user.name}` : ""}</p>
          <h1>Personal Continuity Assistant</h1>
        </div>
        <button className="ghost" onClick={logout}><LogOut size={16} /> Logout</button>
      </header>

      {/* Global Date Switcher Component */}
      <div className="date-header-nav">
        <div className="date-switcher">
          <button className="ghost" onClick={() => shiftDay(-1)}><ChevronLeft size={16} /></button>
          <button className={activeDate === getRelativeDateString(-1) ? "active" : ""} onClick={() => handleDateChange(getRelativeDateString(-1))}>Yesterday</button>
          <button className={activeDate === getRelativeDateString(0) ? "active" : ""} onClick={() => handleDateChange(getRelativeDateString(0))}>Today</button>
          <button className={activeDate === getRelativeDateString(1) ? "active" : ""} onClick={() => handleDateChange(getRelativeDateString(1))}>Tomorrow</button>
          <button className="ghost" onClick={() => shiftDay(1)}><ChevronRight size={16} /></button>
        </div>
        <div className="date-selector-container">
          <Calendar size={16} className="text-secondary" />
          <span className="date-display">
            {new Date(activeDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
          </span>
          <input type="date" className="date-picker-input" value={activeDate} onChange={(event) => handleDateChange(event.target.value)} />
        </div>
      </div>

      <nav className="app-nav" aria-label="Main navigation">
        <button className={activePage === "reflect" ? "active" : ""} onClick={() => setActivePage("reflect")}><MessageSquareText size={17} /> Reflect</button>
        <button className={activePage === "todos" ? "active" : ""} onClick={() => setActivePage("todos")}><CheckCircle2 size={17} /> Todos</button>
        <button className={activePage === "schedule" ? "active" : ""} onClick={() => setActivePage("schedule")}><Clock size={17} /> Schedule</button>
        <button className={activePage === "diary" ? "active" : ""} onClick={() => setActivePage("diary")}><CalendarDays size={17} /> Diary</button>
        <button className={activePage === "memory" ? "active" : ""} onClick={() => setActivePage("memory")}><Brain size={17} /> Memory</button>
      </nav>

      {status && (
        <div className="status">
          <AlertCircle size={16} />
          <span>{status}</span>
        </div>
      )}

      {activePage === "reflect" && (
        <section className="page panel">
          <h2><MessageSquareText size={20} /> Daily reflection</h2>
          <p className="muted">Record or upload a voice transcript or type a daily reflection summary below. The assistant will extract key actions and events.</p>
          <textarea value={transcriptText} onChange={(event) => setTranscriptText(event.target.value)} placeholder="Type, paste, or record today's activities..." />
          
          <div className="actions">
            <button type="button" onClick={recording ? stopRecording : startRecording} className={recording ? "primary" : ""}>
              {recording ? <Square size={16} /> : <Mic size={16} />}
              {recording ? "Stop Recording" : "Record Voice"}
            </button>
            <label className="file-button">
              <Mic size={16} />
              Upload Audio
              <input type="file" accept="audio/*" onChange={uploadAudio} />
            </label>
          </div>

          <div className="actions">
            <button className="primary" disabled={!transcriptText.trim()} onClick={saveTranscript}><Plus size={16} /> Save Transcript</button>
            <select value={activeTranscriptId} onChange={(event) => setActiveTranscriptId(event.target.value)}>
              <option value="">Select a saved transcript</option>
              {transcripts.map((item) => <option key={item._id} value={item._id}>{new Date(item.createdAt).toLocaleString()}</option>)}
            </select>
          </div>

          <div className="actions" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
            <button disabled={!activeTranscriptId} onClick={extractEvents}><Sparkles size={16} /> Extract Structured Memory</button>
            <button className="primary" disabled={!activeTranscriptId} onClick={generateTodos}><CheckCircle2 size={16} /> Suggest Action To-Dos</button>
          </div>

          {events.length > 0 && (
            <List title="Extracted structured events" items={events.map((event) => `${event.eventType}: ${event.content}`)} />
          )}
        </section>
      )}

      {activePage === "todos" && (
        <section className="page panel">
          <h2><CheckCircle2 size={20} /> Tasks and commitments</h2>
          
          {/* AI Suggested Todos Section */}
          {suggestedTodos.length > 0 && (
            <div className="suggestions-box">
              <div className="suggestions-header">
                <h3><Sparkles size={16} style={{ color: "var(--color-accent)", marginRight: "6px" }} /> AI Suggested commitments</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn-accept" onClick={acceptAllSuggestedTodos}><Check size={14} /> Accept All</button>
                  <button className="btn-reject" onClick={dismissAllSuggestedTodos}><X size={14} /> Dismiss All</button>
                </div>
              </div>
              <div className="suggestions-grid">
                {suggestedTodos.map((todo, index) => (
                  <div key={index} className="suggested-todo-card">
                    <div className="suggested-todo-info">
                      <span className="suggested-todo-title">{todo.title}</span>
                      {todo.description && <span className="suggested-todo-desc">{todo.description}</span>}
                      <div className="suggested-todo-meta">
                        <span className={getPriorityBadgeClass(todo.priority)}>{todo.priority}</span>
                        {todo.dueDate && <span className="todo-row-date">Due: {todo.dueDate}</span>}
                      </div>
                    </div>
                    <div className="suggested-todo-actions">
                      <button className="btn-accept" onClick={() => acceptSuggestedTodo(index)} title="Accept"><Check size={14} /></button>
                      <button className="btn-reject" onClick={() => rejectSuggestedTodo(index)} title="Dismiss"><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="todo-split-layout">
            {/* Confirmed List */}
            <div>
              <h3>Confirmed To-Dos</h3>
              <div className="list">
                {todos.length === 0 ? (
                  <p className="muted" style={{ padding: "20px", textAlign: "center", background: "rgba(0,0,0,0.1)", borderRadius: "10px" }}>No tasks logged yet. Create some manually or extract them from reflections.</p>
                ) : (
                  todos.map((todo) => (
                    <div className={`todo-row ${todo.status === "completed" ? "completed" : ""}`} key={todo._id}>
                      <input 
                        type="checkbox" 
                        checked={todo.status === "completed"} 
                        onChange={(event) => updateTodo(todo._id, { status: event.target.checked ? "completed" : "pending" })} 
                      />
                      <span>{todo.title}</span>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span className={getPriorityBadgeClass(todo.priority)}>{todo.priority}</span>
                        {todo.dueDate && <span className="todo-row-date">{todo.dueDate}</span>}
                      </div>
                      <button className="btn-delete-todo" onClick={() => deleteTodo(todo._id)} title="Delete task">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manual Todo Form */}
            <div className="todo-form-card panel">
              <h3>Create manual task</h3>
              <form className="todo-form" onSubmit={addManualTodo}>
                <label>
                  Task Title
                  <input 
                    value={todoForm.title} 
                    onChange={(event) => setTodoForm({ ...todoForm, title: event.target.value })} 
                    placeholder="E.g., Call Mom, Study React" 
                    required 
                  />
                </label>
                <label>
                  Description
                  <textarea 
                    value={todoForm.description} 
                    onChange={(event) => setTodoForm({ ...todoForm, description: event.target.value })} 
                    placeholder="Optional notes..." 
                    style={{ minHeight: "70px" }}
                  />
                </label>
                <div className="todo-form-row">
                  <label>
                    Priority
                    <select 
                      value={todoForm.priority} 
                      onChange={(event) => setTodoForm({ ...todoForm, priority: event.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  <label>
                    Due Date
                    <input 
                      type="date" 
                      value={todoForm.dueDate} 
                      onChange={(event) => setTodoForm({ ...todoForm, dueDate: event.target.value })} 
                    />
                  </label>
                </div>
                <button className="primary" style={{ marginTop: "8px" }}><Plus size={16} /> Add Task</button>
              </form>
            </div>
          </div>
        </section>
      )}

      {activePage === "schedule" && (
        <section className="page panel">
          <h2><Clock size={20} /> 30-minute daily timeline</h2>
          <p className="muted">Log your activities block-by-block. Set Eisenhower urgency/importance directly on each slot.</p>
          
          <div className="schedule-container">
            {/* 48-slot Timeline scroll area */}
            <div className="timeline-scroll-area">
              {timelineSlots.map((slot) => {
                const block = timeBlocks.find(b => b.startTime === slot.startTime);
                const isEditing = editingSlot === slot.startTime;

                return (
                  <div className="timeline-slot" key={slot.startTime}>
                    <div className="timeline-time-label">
                      {formatTimeStr(slot.startTime)}
                    </div>
                    <div>
                      {block ? (
                        <div className={`timeline-block-card q-${block.importance === "high" ? "y" : "n"}${block.urgency === "high" ? "y" : "n"}`}>
                          <div className="timeline-block-details">
                            <span className="timeline-block-activity">{block.activity}</span>
                            <div className="timeline-block-meta">
                              <span className="timeline-block-category">{block.category}</span>
                              <span className="text-muted">•</span>
                              <span className="text-secondary">
                                {block.importance === "high" && block.urgency === "high" && "Urgent & Important (Q1)"}
                                {block.importance === "high" && block.urgency !== "high" && "Important, Not Urgent (Q2)"}
                                {block.importance !== "high" && block.urgency === "high" && "Urgent, Not Important (Q3)"}
                                {block.importance !== "high" && block.urgency !== "high" && "Not Urgent & Not Important (Q4)"}
                              </span>
                            </div>
                          </div>
                          
                          {/* Eisenhower Toggles inside slot */}
                          <div className="timeline-quadrant-indicators">
                            <label className={`quadrant-checkbox-label urgent ${block.urgency === "high" ? "active" : ""}`}>
                              <input 
                                type="checkbox" 
                                checked={block.urgency === "high"} 
                                onChange={() => toggleBlockUrgency(block._id, block.urgency)}
                              />
                              Urg
                            </label>
                            <label className={`quadrant-checkbox-label important ${block.importance === "high" ? "active" : ""}`}>
                              <input 
                                type="checkbox" 
                                checked={block.importance === "high"} 
                                onChange={() => toggleBlockImportance(block._id, block.importance)}
                              />
                              Imp
                            </label>
                            <button className="btn-delete-todo" onClick={() => deleteTimelineBlock(block._id)} style={{ padding: "4px" }} title="Delete block">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ) : isEditing ? (
                        <form 
                          className="timeline-quick-add-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            addTimelineBlock(slot.startTime, slot.endTime);
                          }}
                        >
                          <input 
                            value={quickAdd.activity} 
                            onChange={(e) => setQuickAdd({ ...quickAdd, activity: e.target.value })}
                            placeholder="What did you do?" 
                            autoFocus
                            required
                          />
                          <select 
                            value={quickAdd.category}
                            onChange={(e) => setQuickAdd({ ...quickAdd, category: e.target.value })}
                          >
                            <option value="General">General</option>
                            <option value="Career">Career</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Social">Social</option>
                            <option value="Leisure">Leisure</option>
                            <option value="Chores">Chores</option>
                            <option value="Sleep">Sleep</option>
                          </select>
                          <div className="timeline-quadrant-indicators">
                            <label className={`quadrant-checkbox-label urgent ${quickAdd.urgent ? "active" : ""}`}>
                              <input 
                                type="checkbox" 
                                checked={quickAdd.urgent}
                                onChange={(e) => setQuickAdd({ ...quickAdd, urgent: e.target.checked })}
                              />
                              Urg
                            </label>
                            <label className={`quadrant-checkbox-label important ${quickAdd.important ? "active" : ""}`}>
                              <input 
                                type="checkbox" 
                                checked={quickAdd.important}
                                onChange={(e) => setQuickAdd({ ...quickAdd, important: e.target.checked })}
                              />
                              Imp
                            </label>
                          </div>
                          <button type="submit" className="primary"><Check size={14} /></button>
                          <button type="button" className="ghost" onClick={() => setEditingSlot(null)}><X size={14} /></button>
                        </form>
                      ) : (
                        <div className="timeline-empty-slot-action">
                          <div 
                            className="timeline-input-trigger"
                            onClick={() => {
                              setEditingSlot(slot.startTime);
                              setQuickAdd({ activity: "", category: "General", urgent: false, important: false });
                            }}
                          >
                            + Add what you did here...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Eisenhower Matrix Analytics Column */}
            <div className="eisenhower-matrix-card panel">
              <h3>Eisenhower Matrix</h3>
              <p className="muted" style={{ fontSize: "12px" }}>Summary distribution of your logged time blocks today.</p>
              
              <div className="eisenhower-grid">
                <div className="matrix-quadrant q1">
                  <div>
                    <h4>Q1: Do First</h4>
                    <span className="matrix-count">{eisenhowerStats.q1}</span>
                  </div>
                  <span className="matrix-pct">
                    {eisenhowerStats.total ? Math.round((eisenhowerStats.q1 / eisenhowerStats.total) * 100) : 0}% blocks
                  </span>
                </div>
                
                <div className="matrix-quadrant q2">
                  <div>
                    <h4>Q2: Schedule</h4>
                    <span className="matrix-count">{eisenhowerStats.q2}</span>
                  </div>
                  <span className="matrix-pct">
                    {eisenhowerStats.total ? Math.round((eisenhowerStats.q2 / eisenhowerStats.total) * 100) : 0}% blocks
                  </span>
                </div>

                <div className="matrix-quadrant q3">
                  <div>
                    <h4>Q3: Delegate</h4>
                    <span className="matrix-count">{eisenhowerStats.q3}</span>
                  </div>
                  <span className="matrix-pct">
                    {eisenhowerStats.total ? Math.round((eisenhowerStats.q3 / eisenhowerStats.total) * 100) : 0}% blocks
                  </span>
                </div>

                <div className="matrix-quadrant q4">
                  <div>
                    <h4>Q4: Eliminate</h4>
                    <span className="matrix-count">{eisenhowerStats.q4}</span>
                  </div>
                  <span className="matrix-pct">
                    {eisenhowerStats.total ? Math.round((eisenhowerStats.q4 / eisenhowerStats.total) * 100) : 0}% blocks
                  </span>
                </div>
              </div>
              <div style={{ marginTop: "16px", padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "10px", fontSize: "13px" }}>
                <strong>Total Logged Time:</strong> {eisenhowerStats.total * 30} minutes ({(eisenhowerStats.total * 0.5).toFixed(1)} hrs)
              </div>
            </div>
          </div>
        </section>
      )}

      {activePage === "diary" && (
        <section className="page panel">
          <h2><CalendarDays size={20} /> Daily diary and performance stats</h2>
          
          <div className="diary-split-layout">
            <div className="diary-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Diary Entry</h3>
                {diary && !diaryEditing && (
                  <button onClick={() => setDiaryEditing(true)}><Edit3 size={14} /> Edit Entry</button>
                )}
              </div>

              {diaryEditing ? (
                <>
                  <textarea 
                    value={diary} 
                    onChange={(event) => setDiary(event.target.value)} 
                    placeholder="Write your diary or generate a grounded draft using your reflections, tasks, and schedule blocks..." 
                  />
                  <div className="actions">
                    <button onClick={generateDiary}><Sparkles size={16} /> Generate AI Draft</button>
                    <button className="primary" disabled={!diary.trim()} onClick={confirmDiary}>Confirm and Save Diary</button>
                  </div>
                </>
              ) : (
                <div className="diary-reader-view">
                  {diary}
                  <div style={{ marginTop: "20px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <span className="priority-badge low" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                      Confirmed & Memory-Grounded
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Daily stats summary column */}
            <div>
              <h3>Daily Stats</h3>
              <div className="stats" style={{ gridTemplateColumns: "1fr", gap: "10px" }}>
                <div className="stats-card">
                  <div className="stats-card-value">{dailyStats?.trackedMinutes || 0} min</div>
                  <div className="stats-card-label">Time Tracked</div>
                </div>
                <div className="stats-card">
                  <div className="stats-card-value">{dailyStats?.completedTasks || 0} / {dailyStats?.totalTasks || 0}</div>
                  <div className="stats-card-label">Tasks Completed</div>
                </div>
                <div className="stats-card">
                  <div className="stats-card-value">{dailyStats?.completionRate || 0}%</div>
                  <div className="stats-card-label">Completion Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activePage === "memory" && (
        <section className="page panel">
          <h2><Brain size={20} /> Personal memory query</h2>
          <p className="muted">Search or query your continuity memory system. The AI answers using evidence from your reflections, diary, tasks, and logged events.</p>
          <div className="query-row">
            <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="E.g., What did I promise Disha? What was my focus on Wednesday?" />
            <button className="primary" disabled={!question.trim()} onClick={askMemory}>Ask Memory</button>
            <button disabled={!answer} onClick={speakAnswer}><Volume2 size={16} /> Speak Answer</button>
          </div>
          {answer && <div className="answer">{answer}</div>}
        </section>
      )}
    </main>
  );
}

function List({ title, items }) {
  return (
    <div className="mini-list">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="muted">No items found.</p> : items.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
