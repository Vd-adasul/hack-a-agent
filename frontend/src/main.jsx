import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Brain, CalendarDays, CheckCircle2, Clock, LogOut, MessageSquareText, Mic, Plus, Sparkles, Square, Volume2 } from "lucide-react";
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
      <form className="panel auth-panel" onSubmit={submit}>
        <Brain size={32} />
        <h1>Personal Continuity</h1>
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
  const [timeForm, setTimeForm] = useState({ blockDate: new Date().toISOString().slice(0, 10), startTime: "09:00", endTime: "09:30", activity: "", category: "Career", importance: "medium", urgency: "medium" });
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [diary, setDiary] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [dailyStats, setDailyStats] = useState(null);
  const [status, setStatus] = useState("");
  const [activePage, setActivePage] = useState("reflect");

  const authHeaders = useMemo(() => ({ token }), [token]);

  const loadCore = async () => {
    if (!token) return;
    const [me, todoData, transcriptData, statsData, blocksData] = await Promise.all([
      request("/api/auth/me", authHeaders),
      request("/api/todos", authHeaders),
      request("/api/transcripts", authHeaders),
      request(`/api/analytics/daily?date=${timeForm.blockDate}`, authHeaders),
      request(`/api/timeblocks/day/${timeForm.blockDate}`, authHeaders)
    ]);
    setUser(me.user);
    setTodos(todoData.todos);
    setTranscripts(transcriptData.transcripts);
    setDailyStats(statsData);
    setTimeBlocks(blocksData.timeBlocks);
  };

  useEffect(() => {
    loadCore().catch((err) => {
      setStatus(err.message);
      if (err.message.toLowerCase().includes("token")) logout();
    });
  }, [token]);

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

  const saveTranscript = async () => {
    setStatus("Saving transcript...");
    const data = await request("/api/transcripts", { ...authHeaders, method: "POST", body: { text: transcriptText } });
    setTranscriptText("");
    setActiveTranscriptId(data.transcript._id);
    await loadCore();
    setStatus("Transcript saved.");
  };

  const transcribeBlob = async (blob, filename = "reflection.webm") => {
    setStatus("Transcribing audio...");
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
    await loadCore();
    setStatus("Audio transcribed and saved.");
  };

  const startRecording = async () => {
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
    const data = await request("/api/events/extract", { ...authHeaders, method: "POST", body: { transcriptId: activeTranscriptId } });
    setEvents(data.events);
    setStatus("Events extracted.");
  };

  const generateTodos = async () => {
    setStatus("Generating todos...");
    const data = await request("/api/todos/generate", { ...authHeaders, method: "POST", body: { transcriptId: activeTranscriptId } });
    setSuggestedTodos(data.todos);
    setStatus("Todo suggestions ready.");
  };

  const confirmTodos = async () => {
    setStatus("Saving todos...");
    await request("/api/todos/confirm", { ...authHeaders, method: "POST", body: { todos: suggestedTodos.map((todo) => ({ ...todo, transcriptId: activeTranscriptId })) } });
    setSuggestedTodos([]);
    await loadCore();
    setStatus("Todos saved.");
  };

  const updateTodo = async (id, patch) => {
    await request(`/api/todos/${id}`, { ...authHeaders, method: "PATCH", body: patch });
    await loadCore();
  };

  const addTimeBlock = async (event) => {
    event.preventDefault();
    await request("/api/timeblocks", { ...authHeaders, method: "POST", body: timeForm });
    setTimeForm({ ...timeForm, activity: "" });
    await loadCore();
  };

  const generateDiary = async () => {
    setStatus("Generating diary...");
    const data = await request("/api/diary/generate", { ...authHeaders, method: "POST", body: { date: timeForm.blockDate } });
    setDiary(data.diary.content);
    setStatus("Diary draft ready.");
  };

  const confirmDiary = async () => {
    await request("/api/diary/confirm", { ...authHeaders, method: "POST", body: { diaryDate: timeForm.blockDate, content: diary } });
    setStatus("Diary confirmed.");
  };

  const askMemory = async () => {
    setStatus("Searching memory...");
    const data = await request("/api/query", { ...authHeaders, method: "POST", body: { question } });
    setAnswer(data.answer);
    setStatus("Answer ready.");
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

      <nav className="app-nav" aria-label="Main navigation">
        <button className={activePage === "reflect" ? "active" : ""} onClick={() => setActivePage("reflect")}><MessageSquareText size={17} /> Reflect</button>
        <button className={activePage === "todos" ? "active" : ""} onClick={() => setActivePage("todos")}><CheckCircle2 size={17} /> Todos</button>
        <button className={activePage === "schedule" ? "active" : ""} onClick={() => setActivePage("schedule")}><Clock size={17} /> Schedule</button>
        <button className={activePage === "diary" ? "active" : ""} onClick={() => setActivePage("diary")}><CalendarDays size={17} /> Diary</button>
        <button className={activePage === "memory" ? "active" : ""} onClick={() => setActivePage("memory")}><Brain size={17} /> Memory</button>
      </nav>

      {status && <p className="status">{status}</p>}

      {activePage === "reflect" && (
        <section className="page panel">
          <h2><MessageSquareText size={20} /> Daily reflection</h2>
          <p className="muted">Record, upload, or type one reflection at a time.</p>
          <textarea value={transcriptText} onChange={(event) => setTranscriptText(event.target.value)} placeholder="Paste or type today's voice transcript..." />
          <div className="actions">
            <button type="button" onClick={recording ? stopRecording : startRecording}>
              {recording ? <Square size={16} /> : <Mic size={16} />}
              {recording ? "Stop" : "Record"}
            </button>
            <label className="file-button">
              <Mic size={16} />
              Upload audio
              <input type="file" accept="audio/*" onChange={uploadAudio} />
            </label>
          </div>
          <div className="actions">
            <button className="primary" disabled={!transcriptText.trim()} onClick={saveTranscript}><Plus size={16} /> Save</button>
            <select value={activeTranscriptId} onChange={(event) => setActiveTranscriptId(event.target.value)}>
              <option value="">Select transcript</option>
              {transcripts.map((item) => <option key={item._id} value={item._id}>{new Date(item.createdAt).toLocaleString()}</option>)}
            </select>
          </div>
          <div className="actions">
            <button disabled={!activeTranscriptId} onClick={extractEvents}><Sparkles size={16} /> Extract</button>
            <button disabled={!activeTranscriptId} onClick={generateTodos}><CheckCircle2 size={16} /> Suggest todos</button>
          </div>
          <List title="Extracted events" items={events.map((event) => `${event.eventType}: ${event.content}`)} />
        </section>
      )}

      {activePage === "todos" && (
        <section className="page panel">
          <h2><CheckCircle2 size={20} /> Todos</h2>
          <p className="muted">Review AI suggestions and track confirmed commitments.</p>
          {suggestedTodos.length > 0 && (
            <div className="suggestions">
              <List title="Suggestions" items={suggestedTodos.map((todo) => `${todo.title} (${todo.priority})`)} />
              <button className="primary" onClick={confirmTodos}>Confirm suggestions</button>
            </div>
          )}
          <div className="list">
            {todos.map((todo) => (
              <label className="todo-row" key={todo._id}>
                <input type="checkbox" checked={todo.status === "completed"} onChange={(event) => updateTodo(todo._id, { status: event.target.checked ? "completed" : "pending" })} />
                <span>{todo.title}</span>
                <small>{todo.priority}</small>
              </label>
            ))}
          </div>
        </section>
      )}

      {activePage === "schedule" && (
        <section className="page panel">
          <h2><Clock size={20} /> Time blocks</h2>
          <p className="muted">Plan focused blocks for the selected day.</p>
          <form className="time-form" onSubmit={addTimeBlock}>
            <input type="date" value={timeForm.blockDate} onChange={(event) => setTimeForm({ ...timeForm, blockDate: event.target.value })} />
            <input type="time" value={timeForm.startTime} onChange={(event) => setTimeForm({ ...timeForm, startTime: event.target.value })} />
            <input type="time" value={timeForm.endTime} onChange={(event) => setTimeForm({ ...timeForm, endTime: event.target.value })} />
            <input value={timeForm.activity} onChange={(event) => setTimeForm({ ...timeForm, activity: event.target.value })} placeholder="Activity" required />
            <input value={timeForm.category} onChange={(event) => setTimeForm({ ...timeForm, category: event.target.value })} placeholder="Category" />
            <button className="primary"><Plus size={16} /> Add</button>
          </form>
          <List title="Today" items={timeBlocks.map((block) => `${block.startTime}-${block.endTime} ${block.activity}`)} />
        </section>
      )}

      {activePage === "diary" && (
        <section className="page panel">
          <h2><CalendarDays size={20} /> Diary and stats</h2>
          <div className="stats">
            <span>{dailyStats?.trackedMinutes || 0} min tracked</span>
            <span>{dailyStats?.completedTasks || 0}/{dailyStats?.totalTasks || 0} tasks</span>
            <span>{dailyStats?.completionRate || 0}% done</span>
          </div>
          <textarea value={diary} onChange={(event) => setDiary(event.target.value)} placeholder="Generate or write diary..." />
          <div className="actions">
            <button onClick={generateDiary}><Sparkles size={16} /> Generate</button>
            <button className="primary" disabled={!diary.trim()} onClick={confirmDiary}>Confirm diary</button>
          </div>
        </section>
      )}

      {activePage === "memory" && (
      <section className="page panel">
        <h2><Brain size={20} /> Memory query</h2>
        <p className="muted">Ask questions grounded in your saved reflections.</p>
        <div className="query-row">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What did I promise Mom?" />
          <button className="primary" disabled={!question.trim()} onClick={askMemory}>Ask</button>
          <button disabled={!answer} onClick={speakAnswer}><Volume2 size={16} /> Speak</button>
        </div>
        {answer && <p className="answer">{answer}</p>}
      </section>
      )}
    </main>
  );
}

function List({ title, items }) {
  return (
    <div className="mini-list">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="muted">No items yet.</p> : items.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
