const inputEl = document.getElementById("inputText");
const summarizeBtn = document.getElementById("summarizeBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const resultEl = document.getElementById("result");
const statusEl = document.getElementById("status");
const countsEl = document.getElementById("counts");
const providerSelect = document.getElementById("providerSelect");

function normalizeWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}

function splitSentences(text) {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) return [];

  const out = [];
  let buf = "";
  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    buf += ch;
    if (ch !== "." && ch !== "!" && ch !== "?") continue;

    const next = cleaned[i + 1] ?? "";
    if (next === " ") {
      const s = buf.trim();
      if (s) out.push(s);
      buf = "";
    }
  }
  const tail = buf.trim();
  if (tail) out.push(tail);

  if (out.length > 0) return out;

  return cleaned.split(/\n+/g).map((s) => s.trim()).filter(Boolean);
}

const STOPWORDS = new Set(
  [
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "has",
    "have",
    "he",
    "her",
    "hers",
    "him",
    "his",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "it's",
    "me",
    "my",
    "not",
    "of",
    "on",
    "or",
    "our",
    "ours",
    "she",
    "so",
    "that",
    "the",
    "their",
    "theirs",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "to",
    "too",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "who",
    "will",
    "with",
    "you",
    "your",
    "yours",
  ].sort()
);

function tokenize(text) {
  const lower = String(text ?? "").toLowerCase();
  let cleaned = lower;
  try {
    cleaned = lower.replace(/[^\p{L}\p{N}\s'-]/gu, " ");
  } catch {
    cleaned = lower.replace(/[^a-z0-9\s'-]/g, " ");
  }
  return cleaned.split(/\s+/g).map((t) => t.trim()).filter(Boolean);
}

function wordFrequencies(sentences) {
  const freq = new Map();
  for (const s of sentences) {
    for (const w of tokenize(s)) {
      if (w.length < 3) continue;
      if (STOPWORDS.has(w)) continue;
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  return freq;
}

function scoreSentence(sentence, freq) {
  const words = tokenize(sentence);
  if (words.length === 0) return 0;

  let score = 0;
  let hits = 0;
  for (const w of words) {
    if (STOPWORDS.has(w) || w.length < 3) continue;
    const f = freq.get(w) ?? 0;
    if (f > 0) {
      score += Math.log(1 + f);
      hits += 1;
    }
  }

  const lengthPenalty = 1 / Math.sqrt(8 + words.length);
  const coverageBoost = Math.min(1.2, 0.85 + hits / Math.max(8, words.length));
  return score * coverageBoost + score * lengthPenalty;
}

function pickSentenceCount(sentenceCount, wordCount) {
  if (sentenceCount <= 2) return 1;
  if (wordCount < 80) return 1;
  if (wordCount < 220) return 2;
  if (wordCount < 500) return 3;
  return Math.min(5, Math.max(3, Math.round(sentenceCount * 0.22)));
}

function summarize(text) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return "";
  if (sentences.length === 1) return sentences[0];

  const wc = tokenize(text).length;
  const k = pickSentenceCount(sentences.length, wc);
  const freq = wordFrequencies(sentences);

  const scored = sentences.map((s, idx) => ({
    idx,
    s,
    score: scoreSentence(s, freq),
  }));

  const top = scored
    .slice()
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, k)
    .sort((a, b) => a.idx - b.idx)
    .map((x) => x.s);

  return top.join(" ");
}

async function summarizeWithApi({ text, provider, timeoutMs = 30000 }) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, provider }),
      signal: controller.signal,
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const err = data?.error || `Request failed (${resp.status})`;
      const details = data?.details ? `\n${data.details}` : "";
      throw new Error(`${err}${details}`);
    }

    const summary = typeof data?.summary === "string" ? data.summary.trim() : "";
    if (!summary) throw new Error("Empty summary returned.");
    return summary;
  } finally {
    clearTimeout(t);
  }
}

function setStatus(message) {
  statusEl.textContent = message ?? "";
}

function setResult(text) {
  if (!text) {
    resultEl.textContent = "Your summary will appear here.";
    resultEl.classList.add("empty");
    copyBtn.disabled = true;
    return;
  }
  resultEl.textContent = text;
  resultEl.classList.remove("empty");
  copyBtn.disabled = false;
}

function updateCounts() {
  const text = inputEl.value ?? "";
  const chars = text.length;
  const words = tokenize(text).length;
  countsEl.textContent = `${words} word${words === 1 ? "" : "s"} • ${chars} char${
    chars === 1 ? "" : "s"
  }`;

  const hasText = normalizeWhitespace(text).length > 0;
  summarizeBtn.disabled = !hasText;
  clearBtn.disabled = !hasText && resultEl.classList.contains("empty");
}

async function onSummarize() {
  const raw = inputEl.value ?? "";
  const text = normalizeWhitespace(raw);
  if (!text) {
    setStatus("Please enter some text to summarize.");
    setResult("");
    updateCounts();
    return;
  }

  summarizeBtn.disabled = true;
  const provider = providerSelect?.value || "groq";
  setStatus(`Summarizing with ${provider}…`);

  try {
    const summary = await summarizeWithApi({ text, provider });
    setResult(summary);
    setStatus(summary ? "Done." : "Could not generate a summary.");
  } catch {
    try {
      const fallback = summarize(text);
      setResult(fallback);
      setStatus("LLM request failed. Showing local fallback summary.");
    } catch {
      setStatus("Something went wrong while summarizing.");
      setResult("");
    }
  } finally {
    updateCounts();
  }
}

function onClear() {
  inputEl.value = "";
  setResult("");
  setStatus("");
  updateCounts();
  inputEl.focus();
}

async function onCopy() {
  const text = resultEl.textContent ?? "";
  if (!text || resultEl.classList.contains("empty")) return;
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard.");
    setTimeout(() => {
      if (statusEl.textContent === "Copied to clipboard.") setStatus("");
    }, 1200);
  } catch {
    setStatus("Copy failed. Select and copy manually.");
  }
}

summarizeBtn.addEventListener("click", onSummarize);
clearBtn.addEventListener("click", onClear);
copyBtn.addEventListener("click", onCopy);
inputEl.addEventListener("input", () => {
  setStatus("");
  updateCounts();
});

updateCounts();
setResult("");
