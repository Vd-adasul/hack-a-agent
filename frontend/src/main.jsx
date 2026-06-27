import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertCircle, Mic, Plus, Sparkles, CheckCircle2, Square, Volume2, Trash2, X, Check, Edit3, Calendar } from "lucide-react";
import "./styles.css";

import { DateProvider, useDateContext } from "./hooks/useDateContext.jsx";
import { useApi } from "./hooks/useApi.jsx";
import { request, getLocalDateString, getRelativeDateString, shiftDate, formatTime, getPriorityClass } from "./utils/api";
import { Layout } from "./components/Layout";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./pages/Dashboard";
import { Inbox } from "./pages/Inbox";
import { Tasks } from "./pages/Tasks";
import { Schedule } from "./pages/Schedule";
import { Diary } from "./pages/Diary";
import { Memory } from "./pages/Memory";
import { TaskCard } from "./components/TaskCard";

function AppContent() {
  const { activeDate, setActiveDate } = useDateContext();
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
  const [todoForm, setTodoForm] = useState({ title: "", description: "", priority: "medium", dueDate: "" });
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [diary, setDiary] = useState("");
  const [diaryConfirmed, setDiaryConfirmed] = useState(false);
  const [diaryEditing, setDiaryEditing] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [quickAdd, setQuickAdd] = useState({ activity: "", category: "General", urgent: false, important: false });
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [dailyStats, setDailyStats] = useState(null);
  const [status, setStatus] = useState("");
  const [activePage, setActivePage] = useState("dashboard");

  const { makeRequest, authHeaders } = useApi(token);

  // Load core data
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

  // Audio functions
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
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
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

  // Todo functions
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

  const updateTodo = async (id, patch) => {
    try {
      await request(`/api/todos/${id}`, { ...authHeaders, method: "PATCH", body: patch });
      await loadCore(activeDate);
    } catch (err) {
      setStatus(err.message);
    }
  };

  const deleteTodo = async (id) => {
    if (!confirm("Delete this task?")) return;
    setStatus("Deleting todo...");
    try {
      await request(`/api/todos/${id}`, { ...authHeaders, method: "DELETE" });
      await loadCore(activeDate);
      setStatus("Todo deleted.");
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
      setStatus("Suggested todo accepted.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const rejectSuggestedTodo = (index) => {
    setSuggestedTodos(prev => prev.filter((_, idx) => idx !== index));
  };

  const generateTodos = async () => {
    setStatus("Generating todo suggestions...");
    try {
      const data = await request("/api/todos/generate", { ...authHeaders, method: "POST", body: { transcriptId: activeTranscriptId } });
      setSuggestedTodos(data.todos || []);
      setStatus("Suggestions ready!");
    } catch (err) {
      setStatus(err.message);
    }
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

  // Eisenhower Stats
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

  // Timeline/Schedule functions
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
    if (!confirm("Delete this time block?")) return;
    try {
      await request(`/api/timeblocks/${id}`, { ...authHeaders, method: "DELETE" });
      await loadCore(activeDate);
    } catch (err) {
      setStatus(err.message);
    }
  };

  // Diary functions
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

  // Memory query
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
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
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
    <Layout activePage={activePage} onPageChange={setActivePage} user={user} onLogout={logout} status={status}>
      {activePage === "dashboard" && (
        <Dashboard
          token={token}
          todos={todos}
          timeBlocks={timeBlocks}
          dailyStats={dailyStats}
          onReflectionClick={() => setActivePage("inbox")}
        />
      )}

      {activePage === "inbox" && (
        <Inbox
          transcriptText={transcriptText}
          setTranscriptText={setTranscriptText}
          recording={recording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onSaveTranscript={saveTranscript}
          transcripts={transcripts}
          activeTranscriptId={activeTranscriptId}
          setActiveTranscriptId={setActiveTranscriptId}
          onExtractEvents={extractEvents}
          onGenerateTodos={generateTodos}
          events={events}
        />
      )}

      {activePage === "tasks" && (
        <Tasks
          todos={todos}
          suggestedTodos={suggestedTodos}
          todoForm={todoForm}
          setTodoForm={setTodoForm}
          onAddTodo={addManualTodo}
          onToggleTodo={(id, status) => updateTodo(id, { status })}
          onDeleteTodo={deleteTodo}
          onAcceptSuggested={acceptSuggestedTodo}
          onRejectSuggested={rejectSuggestedTodo}
          activeDate={activeDate}
        />
      )}

      {activePage === "schedule" && (
        <Schedule
          timeBlocks={timeBlocks}
          onDeleteBlock={deleteTimelineBlock}
          onAddBlock={addTimelineBlock}
          eisenhowerStats={eisenhowerStats}
        />
      )}

      {activePage === "diary" && (
        <Diary
          diary={diary}
          setDiary={setDiary}
          diaryEditing={diaryEditing}
          setDiaryEditing={setDiaryEditing}
          onGenerateDiary={generateDiary}
          onConfirmDiary={confirmDiary}
          dailyStats={dailyStats}
        />
      )}

      {activePage === "memory" && (
        <Memory
          question={question}
          setQuestion={setQuestion}
          answer={answer}
          onAskMemory={askMemory}
          onSpeakAnswer={speakAnswer}
        />
      )}

      {activePage === "settings" && (
        <section className="page">
          <h2>Settings</h2>
          <p className="muted">Settings coming soon...</p>
        </section>
      )}
    </Layout>
  );
}

function App() {
  return (
    <DateProvider>
      <AppContent />
    </DateProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
