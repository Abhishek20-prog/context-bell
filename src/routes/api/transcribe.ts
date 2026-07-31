import { createFileRoute } from "@tanstack/react-router";
import { TRANSCRIBE_MODEL, TRANSCRIBE_URL } from "@/lib/ai-prompt.server";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI is not configured", { status: 500 });

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size < 1024) {
          return new Response("A non-empty audio file is required", { status: 400 });
        }
        if (file.size > 20 * 1024 * 1024) {
          return new Response("Recording is too long — keep it under ~10 minutes", { status: 413 });
        }

        const upstream = new FormData();
        upstream.append("model", TRANSCRIBE_MODEL);
        upstream.append("file", file, "recording.wav");

        const res = await fetch(TRANSCRIBE_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return new Response(detail || "Transcription failed", { status: res.status });
        }

        const data = (await res.json()) as { text?: string };
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
