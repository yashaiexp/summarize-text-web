import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

function badRequest(res, message, details) {
  res.status(400).json({ error: message, details });
}

function serverError(res, message) {
  res.status(500).json({ error: message });
}

function buildPrompt(text) {
  return [
    "Summarize the text clearly and accurately.",
    "Constraints:",
    "- 3–6 bullet points",
    "- Keep key numbers, names, and decisions",
    "- No fluff, no extra commentary",
    "",
    "Text:",
    text,
  ].join("\n");
}

async function summarizeWithGroq(text) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 400, error: "Missing GROQ_API_KEY in .env" };
  }

  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const body = {
    model,
    temperature: 0.2,
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful summarization assistant. Follow the constraints exactly.",
      },
      { role: "user", content: buildPrompt(text) },
    ],
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    return {
      ok: false,
      status: resp.status,
      error: `Groq API error (${resp.status})`,
      details: errText.slice(0, 2000),
    };
  }

  const data = await resp.json();
  const out = data?.choices?.[0]?.message?.content?.trim?.() || "";
  return { ok: true, summary: out };
}

async function summarizeWithGemini(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 400, error: "Missing GEMINI_API_KEY in .env" };
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(text) }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 350,
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    return {
      ok: false,
      status: resp.status,
      error: `Gemini API error (${resp.status})`,
      details: errText.slice(0, 2000),
    };
  }

  const data = await resp.json();
  const out =
    data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("")?.trim?.() ||
    "";
  return { ok: true, summary: out };
}

app.post("/api/summarize", async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text : "";
  const provider =
    typeof req.body?.provider === "string" ? req.body.provider : "groq";

  const trimmed = text.trim();
  if (!trimmed) return badRequest(res, "Text is required.");
  if (trimmed.length > 50_000) {
    return badRequest(res, "Text too long (max 50,000 characters).");
  }

  try {
    let result;
    if (provider === "gemini") result = await summarizeWithGemini(trimmed);
    else if (provider === "groq") result = await summarizeWithGroq(trimmed);
    else return badRequest(res, "Invalid provider.", { provider });

    if (!result.ok) {
      return res.status(result.status || 500).json({
        error: result.error || "Summarization failed.",
        details: result.details,
      });
    }

    if (!result.summary) {
      return serverError(res, "Empty summary returned by provider.");
    }

    res.json({ summary: result.summary });
  } catch (e) {
    res.status(500).json({
      error: "Unexpected server error.",
      details: e instanceof Error ? e.message : String(e),
    });
  }
});

app.use(express.static(__dirname));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
});

