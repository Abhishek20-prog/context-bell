import type { ChatMessage } from "@/types";

export interface StreamParams {
  messages: Pick<ChatMessage, "role" | "content">[];
  transcript?: string;
  source?: string;
  strictMode: boolean;
  language: string;
  preferredAI: string;
}

/** Streams a lecture-grounded answer, invoking onDelta for each token. */
export async function streamChat(
  params: StreamParams,
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    ...(signal ? { signal } : {}),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI rate limit reached. Please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up to continue.");
    throw new Error(detail || "The AI could not respond right now.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      } catch {
        /* partial frame — ignore */
      }
    }
  }

  return full;
}

export async function transcribeSegment(blob: Blob, language?: string): Promise<string> {
  const form = new FormData();
  form.append("file", blob, "context.wav");
  if (language) form.append("language", language);
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || "Could not transcribe the captured lecture audio.");
  }
  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}

export async function generateStudyPack(params: {
  topic: string;
  transcript?: string;
  sections: string[];
  strictMode: boolean;
  language: string;
  preferredAI: string;
}): Promise<string> {
  const res = await fetch("/api/study-pack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || "Could not generate the study pack.");
  }
  const data = (await res.json()) as { markdown?: string };
  return data.markdown ?? "";
}
