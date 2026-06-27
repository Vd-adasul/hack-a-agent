# Personal Continuity Assistant

A hackathon-ready personal growth assistant that turns daily reflections into structured memory, todos, diary entries, time tracking, and searchable answers. The product is intentionally split into a Render-friendly backend and a Vercel-friendly frontend.

## Hackathon Focus

This project is built around **ASI1** as the primary intelligence layer.

ASI1 is used for:

- Extracting structured personal events from reflections.
- Generating actionable todos from transcripts.
- Creating diary entries from the user's day.
- Answering memory questions from stored personal context.
- Producing weekly growth reports.

Speech-to-text and text-to-speech are also included:

- STT uses Groq's OpenAI-compatible Whisper transcription endpoint.
- TTS uses Gemini's native audio generation API.
- Browser speech synthesis is used as a frontend fallback if hosted TTS is unavailable.

The backend calls ASI1 through its OpenAI-compatible chat completions API:

- Base URL: `https://api.asi1.ai/v1`
- Model: `asi1`
- Auth env var: `ASI_ONE_API_KEY`
- Session continuity: `x-session-id` headers are sent per AI workflow.
- Structured output: JSON Schema response format is used for event and todo generation.

The actual ASI key is intentionally **not committed**. It should be configured as an environment variable on Render.

## Product Vision

Personal Continuity Assistant is a lightweight second brain for daily life. A user can write or paste a voice transcript from their day, and the app helps them remember what matters:

- Commitments and promises.
- People, projects, goals, habits, and emotions.
- Todos generated from real reflections.
- 30-minute time blocks for productivity tracking.
- Diary entries grounded in the day's evidence.
- Searchable memory questions such as "What did I promise Mom?"

## Tech Stack

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- bcrypt password hashing
- Multer for future audio upload support
- Groq Whisper transcription for speech-to-text
- Gemini native TTS for generated speech
- ASI1 chat completions API

### Frontend

- Vite
- React
- CSS
- lucide-react icons

## Repository Structure

```text
.
├── backend
│   ├── src
│   │   ├── models.js
│   │   ├── server.js
│   │   └── services
│   │       ├── asi.js
│   │       ├── auth.js
│   │       └── db.js
│   ├── .env.example
│   ├── package.json
│   └── render.yaml
├── frontend
│   ├── src
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── package.json
│   └── vercel.json
└── README.md
```

## Core Features

### Authentication

Users can register, log in, and access protected routes through JWT bearer tokens.

### Reflection and Transcript Storage

The app stores daily transcript text. Users can either type/paste a reflection, record directly in the browser, or upload an audio file. Uploaded or recorded audio is sent to the backend, transcribed with Groq Whisper, saved as a transcript, and then used by the ASI1 workflows.

### Speech-to-Text

The notebook prototype used `faster-whisper` locally. For deployment compatibility on Render, the production backend uses Groq's hosted Whisper endpoint:

- Endpoint: `https://api.groq.com/openai/v1/audio/transcriptions`
- Env var: `GROQ_API_KEY`
- Default model: `whisper-large-v3-turbo`
- Backend route: `POST /api/audio/transcribe`

This keeps the hosted backend lightweight while preserving the Whisper-based STT idea from the prototype.

### Text-to-Speech

The notebook prototype used Piper locally. For deployment compatibility, the backend uses Gemini native audio generation for TTS:

- Env var: `GOOGLE_API_KEY`
- Endpoint: Gemini `generateContent` audio API
- Model: `gemini-2.5-flash-preview-tts`
- Backend route: `POST /api/audio/tts`

The frontend also falls back to the browser's built-in `speechSynthesis` API if hosted TTS fails during a demo.

### ASI1 Event Extraction

The backend sends transcripts to ASI1 and asks for structured JSON events:

- `PERSON`
- `TASK`
- `PROJECT`
- `GOAL`
- `PROMISE`
- `EMOTION`
- `HABIT`
- `EVENT`

These extracted events are stored in MongoDB and also added into the memory system.

### ASI1 Todo Generation

ASI1 converts real commitments and next actions from transcripts into suggested todos. The user can confirm those todos before they are saved.

### Time Blocks

Users can log 30-minute activity blocks with category, importance, and urgency. This powers daily analytics and future productivity visualizations.

### Diary Generation

ASI1 generates a grounded diary draft from transcripts, todos, time blocks, and extracted events. The user can edit and confirm the diary entry.

### Memory Query

The app stores memory records from transcripts, events, todos, diary entries, and time blocks. Questions are answered by retrieving relevant memories and sending them to ASI1 for a grounded response.

### Analytics

The backend exposes daily, weekly, and monthly analytics routes for:

- Completed tasks.
- Completion rate.
- Tracked minutes.
- Category breakdown.
- Weekly AI growth report.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Transcripts and Audio

- `POST /api/audio/upload`
- `POST /api/audio/transcribe`
- `POST /api/audio/tts`
- `POST /api/transcripts`
- `GET /api/transcripts`

### ASI1 AI Workflows

- `POST /api/events/extract`
- `POST /api/todos/generate`
- `POST /api/diary/generate`
- `POST /api/query`
- `GET /api/analytics/weekly`

### Todos

- `POST /api/todos/confirm`
- `GET /api/todos`
- `PATCH /api/todos/:id`
- `DELETE /api/todos/:id`

### Time Tracking

- `POST /api/timeblocks`
- `GET /api/timeblocks/day/:date`
- `GET /api/timeblocks/week`

### Diary

- `POST /api/diary/confirm`
- `GET /api/diary/:date`

### Analytics

- `GET /api/analytics/daily`
- `GET /api/analytics/weekly`
- `GET /api/analytics/monthly`

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend environment variables:

```bash
PORT=4000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
ASI_ONE_API_KEY=your-asi-one-key
ASI_BASE_URL=https://api.asi1.ai/v1
ASI_MODEL=asi1
GROQ_API_KEY=your-groq-key
STT_MODEL=whisper-large-v3-turbo
GOOGLE_API_KEY=your-google-api-key
TTS_MODEL=gemini-2.5-flash-preview-tts
TTS_VOICE=Kore
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend environment variables:

```bash
VITE_API_URL=http://localhost:4000
```

## Deployment

### Render Backend

1. Create a new Render Web Service from this repository.
2. Set the root directory to `backend`.
3. Use:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add these environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLIENT_ORIGIN`
   - `ASI_ONE_API_KEY`
   - `ASI_BASE_URL=https://api.asi1.ai/v1`
   - `ASI_MODEL=asi1`
   - `GROQ_API_KEY`
   - `STT_MODEL=whisper-large-v3-turbo`
   - `GOOGLE_API_KEY`
   - `TTS_MODEL=gemini-2.5-flash-preview-tts`
   - `TTS_VOICE=Kore`
5. Set `CLIENT_ORIGIN` to the deployed Vercel frontend URL.

### Vercel Frontend

1. Create a new Vercel project from this repository.
2. Set the root directory to `frontend`.
3. Add:
   - `VITE_API_URL=https://your-render-backend-url`
4. Deploy.

## ASI1 Implementation Details

The ASI integration lives in `backend/src/services/asi.js`.

It centralizes:

- API key handling through `ASI_ONE_API_KEY`.
- OpenAI-compatible `/chat/completions` calls.
- `x-session-id` headers for workflow-level continuity.
- Plain text generations through `askAsi`.
- JSON Schema generations through `askAsiJson`.

Structured extraction and todo generation use strict schemas so the backend can safely store AI outputs without fragile text parsing.

## Voice Implementation Details

The voice integration lives in `backend/src/services/voice.js`.

It provides:

- `transcribeAudio`: receives browser-recorded or uploaded audio and sends it to Groq Whisper.
- `synthesizeSpeech`: sends generated text to Gemini TTS and wraps its PCM output as playable WAV audio.

Voice flow:

```text
Microphone or audio upload
↓
POST /api/audio/transcribe
↓
Groq Whisper STT
↓
Transcript stored in MongoDB
↓
ASI1 extracts events, todos, diary, and answers
↓
POST /api/audio/tts
↓
Generated spoken response
```

## Data Model

MongoDB collections include:

- `users`
- `audiofiles`
- `transcripts`
- `extractedevents`
- `todos`
- `diaryentries`
- `timeblocks`
- `memories`
- `weeklyreports`

The schema follows the original project idea: a growth assistant with durable personal memory, todo extraction, diary generation, and analytics.

## Smoke Test Status

The backend was tested locally with real environment values before submission.

Verified routes:

- Health check
- Register
- Current user
- Transcript create/list
- Groq Whisper audio transcription endpoint wiring
- ASI1 event extraction
- ASI1 todo generation
- Todo confirmation/update
- Time block creation
- Daily analytics
- ASI1 memory query
- All 25 API routes, including authentication, ASI1 generation, CRUD, diary, analytics, and memory query
- Gemini TTS to Groq Whisper STT audio round trip

Frontend production build also passes with `npm run build`.

## Security Notes

- Passwords are hashed with bcrypt.
- Auth uses signed JWT bearer tokens.
- Secrets are loaded from environment variables.
- `.env`, `.env.local`, `keys.txt`, `node_modules`, and `dist` are ignored by git.
- The ASI1 key must be configured only in hosting provider environment variables.

## Future Improvements

- Add real audio storage with S3, Cloudinary, or Render disk.
- Add speech-to-text and text-to-speech providers.
- Add vector embeddings for semantic memory retrieval.
- Add richer dashboard visualizations.
- Add refresh tokens and email verification.
- Add automated tests for API routes.
