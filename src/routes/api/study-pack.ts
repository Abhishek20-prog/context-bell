import { createFileRoute } from "@tanstack/react-router";
import { chatCompletion, resolveModel } from "@/services/ai/gateway.server";
import { buildStudyPackPrompt } from "@/services/ai/prompts";

interface Body {
  topic?: string;
  transcript?: string;
  sections?: string[];
  strictMode?: boolean;
  language?: string;
  preferredAI?: string;
}

export const Route = createFileRoute("/api/study-pack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const sections = body.sections?.length
          ? body.sections
          : ["Topic Summary", "Detailed Notes", "Key Concepts", "MCQs", "Flashcards"];

        const upstream = await chatCompletion({
          model: resolveModel(body.preferredAI),
          messages: [
            {
              role: "user",
              content: buildStudyPackPrompt({
                topic: body.topic || "Lecture topic",
                transcript: body.transcript,
                sections,
                strictMode: body.strictMode,
                language: body.language,
              }),
            },
          ],
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "AI request failed", { status: upstream.status || 500 });
        }

        const data = (await upstream.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        return Response.json({ markdown: data.choices?.[0]?.message?.content ?? "" });
      },
    },
  },
});
