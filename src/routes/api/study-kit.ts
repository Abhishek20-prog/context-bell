import { createFileRoute } from "@tanstack/react-router";
import {
  buildStudyKitMessages,
  GATEWAY_URL,
  MODEL,
  STUDY_KIT_SCHEMA,
} from "@/lib/ai-prompt.server";

type Body = { transcript?: string | null; question?: string; answer?: string };

export const Route = createFileRoute("/api/study-kit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
       const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI is not configured", { status: 500 });
        const body = (await request.json()) as Body;
        if (!body.answer || !body.question) {
          return new Response("question and answer are required", { status: 400 });
        }

        const res = await fetch(GATEWAY_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MODEL,
            messages: buildStudyKitMessages({
              transcript: body.transcript ?? null,
              question: body.question,
              answer: body.answer,
            }),
            response_format: {
              type: "json_schema",
              json_schema: { name: "study_kit", strict: true, schema: STUDY_KIT_SCHEMA },
            },
          }),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return new Response(detail || "Study kit generation failed", { status: res.status });
        }

        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content ?? "{}";
        try {
          return Response.json(JSON.parse(content));
        } catch {
          return new Response("AI returned malformed study material", { status: 502 });
        }
      },
    },
  },
});
