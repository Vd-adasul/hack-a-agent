const crypto = require("crypto");

const asiRequest = async (body, sessionId) => {
  if (!process.env.ASI_ONE_API_KEY) {
    throw new Error("ASI_ONE_API_KEY is required.");
  }

  const response = await fetch(`${process.env.ASI_BASE_URL || "https://api.asi1.ai/v1"}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ASI_ONE_API_KEY}`,
      "Content-Type": "application/json",
      "x-session-id": sessionId || crypto.randomUUID()
    },
    body: JSON.stringify({
      model: process.env.ASI_MODEL || "asi1",
      temperature: 0.2,
      ...body
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "ASI request failed.");
  }
  return data;
};

const askAsi = async ({ messages, sessionId }) => {
  const data = await asiRequest({ messages }, sessionId);
  return data.choices?.[0]?.message?.content?.trim() || "";
};

const askAsiJson = async ({ messages, sessionId, schemaName, schema }) => {
  const data = await asiRequest({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        strict: true,
        schema
      }
    }
  }, sessionId);

  const content = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
};

module.exports = { askAsi, askAsiJson };
