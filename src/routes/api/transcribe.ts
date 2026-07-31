import { createFileRoute } from "@tanstack/react-router";
import { transcribeAudio } from "@/services/ai/gateway.server";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const file = form.get("file");
        const language = form.get("language");
        if (!(file instanceof File) || file.size < 1024) {
          return new Response("A valid audio file is required", { status: 400 });
        }
        if (file.size > 20 * 1024 * 1024) {
          return new Response("Audio segment too large", { status: 413 });
        }

        const name = file.name || "context.wav";
        const upstream = await transcribeAudio(
          file,
          name,
          typeof language === "string" ? language : undefined,
        );
        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "Transcription failed", { status: upstream.status || 500 });
        }
        const data = (await upstream.json()) as { text?: string };
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
