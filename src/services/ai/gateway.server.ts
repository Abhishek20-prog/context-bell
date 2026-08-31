/**
 * Modular AI layer — connects directly to Google Gemini API.
 * Swapping models only requires changing resolveModel().
 */

// Gemini's OpenAI-compatible endpoint (for chat/completions)
const OPENAI_COMPAT = "https://generativelanguage.googleapis.com/v1beta/openai";
// Gemini native endpoint (for audio transcription)
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function resolveModel(preferred?: string) {
  switch (preferred) {
    case "gemini-pro":
      return "gemini-2.5-pro";
    case "gemini":
    default:
      return "gemini-3.6-flash";
  }
}

function apiKey() {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("Missing GEMINI_API_KEY in .env");
  return key;
}

export async function chatCompletion(body: Record<string, unknown>) {
  return fetch(`${OPENAI_COMPAT}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function transcribeAudio(file: File | Blob, filename: string, language?: string) {
  // Gemini has no OpenAI-compatible audio endpoint, so we use the native
  // multimodal generateContent API with inline base64 audio.
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const ext = filename.split(".").pop()?.toLowerCase() ?? "wav";
  const mimeType =
    ext === "mp3" ? "audio/mpeg" :
    ext === "webm" ? "audio/webm" :
    ext === "ogg" ? "audio/ogg" :
    ext === "m4a" ? "audio/mp4" :
    "audio/wav";

  const prompt = language
    ? `Transcribe this audio accurately in ${language}. Return ONLY the transcribed text with no extra commentary.`
    : "Transcribe this audio accurately. Return ONLY the transcribed text with no extra commentary.";

  const key = apiKey();
  const res = await fetch(
    `${GEMINI_BASE}/models/gemini-3.6-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
      }),
    },
  );

  if (!res.ok) return res;

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Return in the same { text } shape the route handler expects
  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
