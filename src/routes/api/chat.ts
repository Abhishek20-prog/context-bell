import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI } from "@google/genai";
import {
  buildChatMessages,
  MODEL,
  type ToneKey,
} from "@/lib/ai-prompt.server";

type Body = {
  question?: string;
  transcript?: string | null;
  history?: { role: "user" | "assistant"; content: string }[];
  tone?: ToneKey;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Body;

          if (!body.question) {
            return new Response("Question is required", {
              status: 400,
            });
          }

          const apiKey = process.env.GEMINI_API_KEY;

          if (!apiKey) {
            return new Response("Gemini API key missing", {
              status: 500,
            });
          }

          const ai = new GoogleGenAI({
            apiKey,
          });

          const messages = buildChatMessages({
            question: body.question,
            transcript: body.transcript ?? null,
            history: body.history ?? [],
            tone: body.tone ?? "balanced",
          });

          const system =
            messages.find((m) => m.role === "system")?.content ?? "";

          const conversation = messages
            .filter((m) => m.role !== "system")
            .map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            }));

          const response = await ai.models.generateContent({
            model: MODEL,
            contents: conversation,
            config: {
              systemInstruction: system,
              temperature: 0.5,
            },
          });

          return Response.json({
            answer: response.text ?? "",
          });
        } catch (err) {
          console.error(err);

          return new Response("Gemini request failed", {
            status: 500,
          });
        }
      },
    },
  },
});