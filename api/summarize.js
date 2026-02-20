// Vercel serverless function for text summarization
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  function badRequest(message, details) {
    return res.status(400).json({ error: message, details });
  }

  function serverError(message) {
    return res.status(500).json({ error: message });
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
      return {
        ok: false,
        status: 400,
        error: "Missing GROQ_API_KEY environment variable",
      };
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

    try {
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
    } catch (e) {
      return {
        ok: false,
        status: 500,
        error: "Groq API request failed",
        details: e instanceof Error ? e.message : String(e),
      };
    }
  }

  async function summarizeWithGemini(text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        status: 400,
        error: "Missing GEMINI_API_KEY environment variable",
      };
    }

    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
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
        data?.candidates?.[0]?.content?.parts
          ?.map((p) => p?.text)
          .filter(Boolean)
          .join("")
          ?.trim?.() || "";
      return { ok: true, summary: out };
    } catch (e) {
      return {
        ok: false,
        status: 500,
        error: "Gemini API request failed",
        details: e instanceof Error ? e.message : String(e),
      };
    }
  }

  // Parse request body
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return badRequest("Invalid JSON in request body");
  }

  const text = typeof body?.text === "string" ? body.text : "";
  const provider =
    typeof body?.provider === "string" ? body.provider : "groq";

  const trimmed = text.trim();
  if (!trimmed) return badRequest("Text is required.");
  if (trimmed.length > 50_000) {
    return badRequest("Text too long (max 50,000 characters).");
  }

  try {
    let result;
    if (provider === "gemini") result = await summarizeWithGemini(trimmed);
    else if (provider === "groq") result = await summarizeWithGroq(trimmed);
    else return badRequest("Invalid provider.", { provider });

    if (!result.ok) {
      return res.status(result.status || 500).json({
        error: result.error || "Summarization failed.",
        details: result.details,
      });
    }

    if (!result.summary) {
      return serverError("Empty summary returned by provider.");
    }

    return res.json({ summary: result.summary });
  } catch (e) {
    return res.status(500).json({
      error: "Unexpected server error.",
      details: e instanceof Error ? e.message : String(e),
    });
  }
}
