const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const { connectDb } = require("./services/db");
const { requireAuth } = require("./services/auth");
const { askAsi, askAsiJson } = require("./services/asi");
const { transcribeAudio, synthesizeSpeech } = require("./services/voice");
const {
  User,
  AudioFile,
  Transcript,
  ExtractedEvent,
  Todo,
  DiaryEntry,
  TimeBlock,
  Memory,
  WeeklyReport
} = require("./models");

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((origin) => origin.trim());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const dateRange = (dateText) => {
  const start = dateText ? new Date(`${dateText}T00:00:00.000Z`) : new Date();
  if (!dateText) start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const addMemory = async ({ userId, memoryText, sourceType, sourceId }) => {
  if (!memoryText || !memoryText.trim()) return null;
  return Memory.create({ userId, memoryText: memoryText.trim(), sourceType, sourceId });
};

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "personal-continuity-backend" });
});

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const { name, email, password, goals = [], interests = [] } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required." });

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) return res.status(409).json({ message: "Email is already registered." });

  const user = await User.create({ name, email: email.toLowerCase(), passwordHash: password, goals, interests });
  const token = user.createToken();
  res.status(201).json({ token, user: user.toPublicJson() });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  res.json({ token: user.createToken(), user: user.toPublicJson() });
}));

app.get("/api/auth/me", requireAuth, asyncRoute(async (req, res) => {
  res.json({ user: req.user.toPublicJson() });
}));

app.post("/api/audio/upload", requireAuth, upload.single("audio"), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Audio file is required." });

  const audio = await AudioFile.create({
    userId: req.user.id,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    durationSeconds: Number(req.body.durationSeconds) || undefined,
    storageNote: "File metadata stored. Add object storage before production audio retention."
  });

  res.status(201).json({ audio });
}));

app.post("/api/audio/transcribe", requireAuth, upload.single("audio"), asyncRoute(async (req, res) => {
  const text = await transcribeAudio(req.file);
  const transcript = await Transcript.create({
    userId: req.user.id,
    transcriptText: text.trim()
  });
  await addMemory({ userId: req.user.id, memoryText: transcript.transcriptText, sourceType: "transcript", sourceId: transcript.id });
  res.status(201).json({ transcript, text: transcript.transcriptText });
}));

app.post("/api/audio/tts", requireAuth, asyncRoute(async (req, res) => {
  const audio = await synthesizeSpeech(req.body.text);
  res.setHeader("Content-Type", audio.contentType);
  res.setHeader("Cache-Control", "no-store");
  res.send(audio.buffer);
}));

app.post("/api/transcripts", requireAuth, asyncRoute(async (req, res) => {
  const { text, audioFileId } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ message: "Transcript text is required." });

  const transcript = await Transcript.create({ userId: req.user.id, audioFileId, transcriptText: text.trim() });
  if (audioFileId) await AudioFile.findOneAndUpdate({ _id: audioFileId, userId: req.user.id }, { transcriptId: transcript.id });
  await addMemory({ userId: req.user.id, memoryText: transcript.transcriptText, sourceType: "transcript", sourceId: transcript.id });

  res.status(201).json({ transcript });
}));

app.get("/api/transcripts", requireAuth, asyncRoute(async (req, res) => {
  const transcripts = await Transcript.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
  res.json({ transcripts });
}));

app.post("/api/events/extract", requireAuth, asyncRoute(async (req, res) => {
  const { transcriptId } = req.body;
  const transcript = await Transcript.findOne({ _id: transcriptId, userId: req.user.id });
  if (!transcript) return res.status(404).json({ message: "Transcript not found." });

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["events"],
    properties: {
      events: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["eventType", "content", "metadata"],
          properties: {
            eventType: { type: "string", enum: ["PERSON", "TASK", "PROJECT", "GOAL", "PROMISE", "EMOTION", "HABIT", "EVENT"] },
            content: { type: "string" },
            metadata: {
              type: "object",
              additionalProperties: false,
              required: ["note"],
              properties: {
                note: { type: "string" }
              }
            }
          }
        }
      }
    }
  };

  const result = await askAsiJson({
    sessionId: `extract-${req.user.id}`,
    schemaName: "extracted_events",
    schema,
    messages: [
      { role: "system", content: "Extract concise personal continuity events from the transcript. Keep content directly actionable and faithful to the text." },
      { role: "user", content: transcript.transcriptText }
    ]
  });

  const events = await ExtractedEvent.insertMany((result.events || []).map((event) => ({
    userId: req.user.id,
    transcriptId: transcript.id,
    eventType: event.eventType,
    content: event.content,
    metadata: event.metadata || {}
  })));

  await Promise.all(events.map((event) => addMemory({
    userId: req.user.id,
    memoryText: `${event.eventType}: ${event.content}`,
    sourceType: "event",
    sourceId: event.id
  })));

  res.status(201).json({ events });
}));

app.post("/api/todos/generate", requireAuth, asyncRoute(async (req, res) => {
  const { transcriptId } = req.body;
  const transcript = await Transcript.findOne({ _id: transcriptId, userId: req.user.id });
  if (!transcript) return res.status(404).json({ message: "Transcript not found." });

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["todos"],
    properties: {
      todos: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "description", "dueDate", "priority"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            dueDate: { type: ["string", "null"] },
            priority: { type: "string", enum: ["low", "medium", "high"] }
          }
        }
      }
    }
  };

  const result = await askAsiJson({
    sessionId: `todos-${req.user.id}`,
    schemaName: "suggested_todos",
    schema,
    messages: [
      { role: "system", content: "Convert commitments and next actions into todos. Do not invent tasks. Use null dueDate when unknown." },
      { role: "user", content: transcript.transcriptText }
    ]
  });

  res.json({ todos: result.todos || [] });
}));

app.post("/api/todos/confirm", requireAuth, asyncRoute(async (req, res) => {
  const todos = Array.isArray(req.body.todos) ? req.body.todos : [];
  if (!todos.length) return res.status(400).json({ message: "At least one todo is required." });

  const created = await Todo.insertMany(todos.map((todo) => ({
    userId: req.user.id,
    transcriptId: todo.transcriptId,
    title: todo.title,
    description: todo.description,
    dueDate: todo.dueDate || undefined,
    priority: todo.priority || "medium",
    status: "pending"
  })));

  await Promise.all(created.map((todo) => addMemory({
    userId: req.user.id,
    memoryText: `TODO ${todo.priority}: ${todo.title}${todo.description ? ` - ${todo.description}` : ""}`,
    sourceType: "todo",
    sourceId: todo.id
  })));

  res.status(201).json({ todos: created });
}));

app.get("/api/todos", requireAuth, asyncRoute(async (req, res) => {
  const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ todos });
}));

app.patch("/api/todos/:id", requireAuth, asyncRoute(async (req, res) => {
  const allowed = ["title", "description", "dueDate", "priority", "status"];
  const patch = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (patch.status === "completed") patch.completedAt = new Date();
  if (patch.status && patch.status !== "completed") patch.completedAt = undefined;

  const todo = await Todo.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, patch, { new: true });
  if (!todo) return res.status(404).json({ message: "Todo not found." });
  res.json({ todo });
}));

app.delete("/api/todos/:id", requireAuth, asyncRoute(async (req, res) => {
  const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!todo) return res.status(404).json({ message: "Todo not found." });
  res.json({ ok: true });
}));

app.post("/api/timeblocks", requireAuth, asyncRoute(async (req, res) => {
  const { blockDate, startTime, endTime, activity, category, importance, urgency } = req.body;
  if (!blockDate || !startTime || !endTime || !activity) {
    return res.status(400).json({ message: "blockDate, startTime, endTime, and activity are required." });
  }

  const timeBlock = await TimeBlock.create({ userId: req.user.id, blockDate, startTime, endTime, activity, category, importance, urgency });
  await addMemory({ userId: req.user.id, memoryText: `${blockDate} ${startTime}-${endTime}: ${activity}`, sourceType: "timeblock", sourceId: timeBlock.id });
  res.status(201).json({ timeBlock });
}));

app.get("/api/timeblocks/day/:date", requireAuth, asyncRoute(async (req, res) => {
  const timeBlocks = await TimeBlock.find({ userId: req.user.id, blockDate: req.params.date }).sort({ startTime: 1 });
  res.json({ timeBlocks });
}));

app.get("/api/timeblocks/week", requireAuth, asyncRoute(async (req, res) => {
  const { start, end } = req.query;
  const query = { userId: req.user.id };
  if (start && end) query.blockDate = { $gte: start, $lte: end };
  const timeBlocks = await TimeBlock.find(query).sort({ blockDate: -1, startTime: 1 }).limit(336);
  res.json({ timeBlocks });
}));

app.post("/api/diary/generate", requireAuth, asyncRoute(async (req, res) => {
  const diaryDate = req.body.date || new Date().toISOString().slice(0, 10);
  const { start, end } = dateRange(diaryDate);
  const [transcripts, todos, timeBlocks, events] = await Promise.all([
    Transcript.find({ userId: req.user.id, createdAt: { $gte: start, $lt: end } }),
    Todo.find({ userId: req.user.id, createdAt: { $gte: start, $lt: end } }),
    TimeBlock.find({ userId: req.user.id, blockDate: diaryDate }).sort({ startTime: 1 }),
    ExtractedEvent.find({ userId: req.user.id, createdAt: { $gte: start, $lt: end } })
  ]);

  const content = await askAsi({
    sessionId: `diary-${req.user.id}`,
    messages: [
      { role: "system", content: "Write a grounded first-person diary entry from the provided personal data. Mention commitments, mood, progress, and unresolved tasks. Do not invent details." },
      { role: "user", content: JSON.stringify({ diaryDate, transcripts, todos, timeBlocks, events }) }
    ]
  });

  const diary = await DiaryEntry.findOneAndUpdate(
    { userId: req.user.id, diaryDate },
    { content, confirmed: false },
    { new: true, upsert: true }
  );

  res.json({ diary });
}));

app.post("/api/diary/confirm", requireAuth, asyncRoute(async (req, res) => {
  const { diaryDate, content } = req.body;
  if (!diaryDate || !content) return res.status(400).json({ message: "diaryDate and content are required." });

  const diary = await DiaryEntry.findOneAndUpdate(
    { userId: req.user.id, diaryDate },
    { content, confirmed: true },
    { new: true, upsert: true }
  );
  await addMemory({ userId: req.user.id, memoryText: `Diary ${diaryDate}: ${content}`, sourceType: "diary", sourceId: diary.id });
  res.json({ diary });
}));

app.get("/api/diary/:date", requireAuth, asyncRoute(async (req, res) => {
  const diary = await DiaryEntry.findOne({ userId: req.user.id, diaryDate: req.params.date });
  res.json({ diary });
}));

app.post("/api/query", requireAuth, asyncRoute(async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ message: "Question is required." });

  const memories = await Memory.find(
    { userId: req.user.id, $text: { $search: question } },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } }).limit(10);

  const fallbackMemories = memories.length ? memories : await Memory.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10);
  const answer = await askAsi({
    sessionId: `query-${req.user.id}`,
    messages: [
      { role: "system", content: "Answer from the provided personal memories. If the answer is not present, say you do not have enough memory yet." },
      { role: "user", content: JSON.stringify({ question, memories: fallbackMemories.map((memory) => memory.memoryText) }) }
    ]
  });

  res.json({ answer, memories: fallbackMemories });
}));

app.get("/api/analytics/daily", requireAuth, asyncRoute(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const { start, end } = dateRange(date);
  const [todos, timeBlocks] = await Promise.all([
    Todo.find({ userId: req.user.id, createdAt: { $gte: start, $lt: end } }),
    TimeBlock.find({ userId: req.user.id, blockDate: date })
  ]);
  const completedTasks = todos.filter((todo) => todo.status === "completed").length;
  const categoryBreakdown = timeBlocks.reduce((totals, block) => {
    const key = block.category || "Uncategorized";
    totals[key] = (totals[key] || 0) + 30;
    return totals;
  }, {});

  res.json({
    date,
    totalTasks: todos.length,
    completedTasks,
    completionRate: todos.length ? Math.round((completedTasks / todos.length) * 100) : 0,
    trackedMinutes: timeBlocks.length * 30,
    categoryBreakdown
  });
}));

app.get("/api/analytics/weekly", requireAuth, asyncRoute(async (req, res) => {
  const weekStart = req.query.weekStart || new Date().toISOString().slice(0, 10);
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const reportText = await askAsi({
    sessionId: `weekly-${req.user.id}`,
    messages: [
      { role: "system", content: "Create a concise weekly growth report from todos, diary entries, and time blocks." },
      { role: "user", content: JSON.stringify({
        todos: await Todo.find({ userId: req.user.id, createdAt: { $gte: start, $lt: end } }),
        diaries: await DiaryEntry.find({ userId: req.user.id, diaryDate: { $gte: weekStart, $lte: end.toISOString().slice(0, 10) } }),
        timeBlocks: await TimeBlock.find({ userId: req.user.id, blockDate: { $gte: weekStart, $lte: end.toISOString().slice(0, 10) } })
      }) }
    ]
  });
  const report = await WeeklyReport.create({ userId: req.user.id, weekStart, weekEnd: end.toISOString().slice(0, 10), reportText });
  res.json({ report });
}));

app.get("/api/analytics/monthly", requireAuth, asyncRoute(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const todos = await Todo.find({ userId: req.user.id, createdAt: { $gte: new Date(`${month}-01T00:00:00.000Z`) } });
  const timeBlocks = await TimeBlock.find({ userId: req.user.id, blockDate: new RegExp(`^${month}`) });
  res.json({
    month,
    totalTasks: todos.length,
    completedTasks: todos.filter((todo) => todo.status === "completed").length,
    trackedMinutes: timeBlocks.length * 30
  });
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

connectDb().then(() => {
  app.listen(PORT, () => console.log(`Personal Continuity API running on ${PORT}`));
});
