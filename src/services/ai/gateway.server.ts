/**
 * Modular AI layer. Swapping Gemini for another LLM only requires changing
 * `resolveModel` — no call sites change.
 */
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export function resolveModel(preferred?: string) {
  switch (preferred) {
    case "gemini-pro":
      return "google/gemini-3-pro-preview";
    case "gemini":
    default:
      return "google/gemini-3.6-flash";
  }
}

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return key;
}

export async function chatCompletion(body: Record<string, unknown>) {
  return fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function transcribeAudio(file: File | Blob, filename: string, language?: string) {
  const form = new FormData();
  form.append("model", "openai/gpt-4o-mini-transcribe");
  form.append("file", file, filename);
  if (language && /^[a-z]{2}$/.test(language)) form.append("language", language);
  return fetch(`${GATEWAY}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  });
}
