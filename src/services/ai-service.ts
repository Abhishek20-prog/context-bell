import type { ChatMessage, StudyKit } from "@/types";

export type AiTone = "simple" | "balanced" | "exam";

export type ChatRequest = {
  question: string;
  transcript: string | null;
  history: Pick<ChatMessage, "role" | "content">[];
  tone: AiTone;
};

/**
 * Thin client-side layer over the app's AI endpoints. Swapping the LLM
 * provider only requires changing the server routes in src/routes/api.
 */
export const aiService = {
async streamAnswer(
  req: ChatRequest,
  onToken: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
    signal,
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }

  const data = (await res.json()) as {
    answer: string;
  };

  const answer = data.answer ?? "";

  // Fake streaming so the typing animation still works
  for (const ch of answer) {
    onToken(ch);
    await new Promise((r) => setTimeout(r, 8));
  }

  return answer;
},

  async transcribe(blob: Blob): Promise<string> {
    const form = new FormData();
    form.append("file", blob, "recording.wav");
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    if (!res.ok) throw new Error(await readError(res));
    const data = (await res.json()) as { text: string };
    return data.text ?? "";
  },

  async studyKit(input: {
    transcript: string | null;
    question: string;
    answer: string;
  }): Promise<StudyKit> {
    const res = await fetch("/api/study-kit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await readError(res));
    return (await res.json()) as StudyKit;
  },

  async searchVideos(query: string) {
    const res = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(await readError(res));
    return (await res.json()) as {
      results: { id: string; title: string; channel: string; thumbnail: string }[];
    };
  },
};

async function readError(res: Response) {
  const text = await res.text().catch(() => "");
  if (res.status === 429) return "AI is rate limited right now — try again in a moment.";
  if (res.status === 402) return "AI credits exhausted for this workspace.";
  return text || `Request failed (${res.status})`;
}
