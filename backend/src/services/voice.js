const transcribeAudio = async (file) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is required for speech-to-text.");
  }
  if (!file) {
    throw new Error("Audio file is required.");
  }

  const formData = new FormData();
  formData.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname || "audio.webm");
  formData.append("model", process.env.STT_MODEL || "whisper-large-v3-turbo");
  formData.append("response_format", "json");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: formData
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "Speech-to-text failed.");
  }

  return data.text || "";
};

const pcmToWav = (pcm, sampleRate = 24000) => {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

const synthesizeSpeech = async (text) => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is required for Gemini text-to-speech.");
  }
  if (!text || !text.trim()) {
    throw new Error("Text is required for text-to-speech.");
  }

  const model = process.env.TTS_MODEL || "gemini-2.5-flash-preview-tts";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": process.env.GOOGLE_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Read this text naturally and exactly as written: ${text.trim()}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: process.env.TTS_VOICE || "Kore" }
          }
        }
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "Text-to-speech failed.");
  }

  const encodedAudio = data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData?.data;
  if (!encodedAudio) throw new Error("Gemini returned no audio data.");

  return {
    buffer: pcmToWav(Buffer.from(encodedAudio, "base64")),
    contentType: "audio/wav"
  };
};

module.exports = { transcribeAudio, synthesizeSpeech };
