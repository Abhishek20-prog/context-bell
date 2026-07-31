import { createFileRoute } from "@tanstack/react-router";
import { ChatWorkspace } from "@/features/chatbot/ChatWorkspace";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/chat/")({
  head: () => ({
    meta: [
      { title: "ContextBell AI Chat — Lecture-Grounded Answers" },
      {
        name: "description",
        content: "Chat with an AI that answers from your captured lecture transcript first.",
      },
      { property: "og:title", content: "ContextBell AI Chat" },
      { property: "og:description", content: "Lecture-grounded AI explanations with streaming answers." },
    ],
  }),
  component: () => (
    <AppShell title="ContextBell AI" subtitle="Transcript-first explanations for your lecture">
      <ChatWorkspace />
    </AppShell>
  ),
});
