const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  goals: [{ type: String }],
  interests: [{ type: String }]
}, { timestamps: true });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.createToken = function createToken() {
  return jwt.sign({ userId: this.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

userSchema.methods.toPublicJson = function toPublicJson() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    goals: this.goals,
    interests: this.interests
  };
};

const audioFileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  originalName: String,
  mimeType: String,
  sizeBytes: Number,
  durationSeconds: Number,
  transcriptId: { type: Schema.Types.ObjectId, ref: "Transcript" },
  storageNote: String
}, { timestamps: true });

const transcriptSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  audioFileId: { type: Schema.Types.ObjectId, ref: "AudioFile" },
  transcriptText: { type: String, required: true }
}, { timestamps: true });

const extractedEventSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  transcriptId: { type: Schema.Types.ObjectId, ref: "Transcript" },
  eventType: { type: String, enum: ["PERSON", "TASK", "PROJECT", "GOAL", "PROMISE", "EMOTION", "HABIT", "EVENT"], required: true },
  content: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const todoSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  transcriptId: { type: Schema.Types.ObjectId, ref: "Transcript" },
  title: { type: String, required: true },
  description: String,
  dueDate: String,
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  status: { type: String, enum: ["pending", "completed", "cancelled", "postponed"], default: "pending" },
  completedAt: Date
}, { timestamps: true });

const diaryEntrySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  diaryDate: { type: String, required: true },
  content: { type: String, required: true },
  confirmed: { type: Boolean, default: false }
}, { timestamps: true });

diaryEntrySchema.index({ userId: 1, diaryDate: 1 }, { unique: true });

const timeBlockSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  blockDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  activity: { type: String, required: true },
  category: { type: String, default: "General" },
  importance: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  urgency: { type: String, enum: ["low", "medium", "high"], default: "medium" }
}, { timestamps: true });

const memorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  memoryText: { type: String, required: true },
  sourceType: { type: String, enum: ["transcript", "todo", "diary", "event", "timeblock"], required: true },
  sourceId: Schema.Types.ObjectId
}, { timestamps: true });

memorySchema.index({ memoryText: "text" });

const weeklyReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  weekStart: String,
  weekEnd: String,
  reportText: String
}, { timestamps: true });

module.exports = {
  User: mongoose.model("User", userSchema),
  AudioFile: mongoose.model("AudioFile", audioFileSchema),
  Transcript: mongoose.model("Transcript", transcriptSchema),
  ExtractedEvent: mongoose.model("ExtractedEvent", extractedEventSchema),
  Todo: mongoose.model("Todo", todoSchema),
  DiaryEntry: mongoose.model("DiaryEntry", diaryEntrySchema),
  TimeBlock: mongoose.model("TimeBlock", timeBlockSchema),
  Memory: mongoose.model("Memory", memorySchema),
  WeeklyReport: mongoose.model("WeeklyReport", weeklyReportSchema)
};
