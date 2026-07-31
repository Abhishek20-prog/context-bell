import { createFileRoute } from "@tanstack/react-router";
import { ChatWorkspace } from "@/features/chatbot/ChatWorkspace";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/chat/$chatId")({
  head: () => ({
    meta: [
      { title: "Lecture Conversation — ContextBell AI" },
      {
        name: "description",
        content: "Your saved ContextBell conversation grounded in the captured lecture context.",
      },
      { property: "og:title", content: "Lecture Conversation — ContextBell AI" },
      { property: "og:description", content: "Contextual AI explanations from your lecture transcript." },
    ],
  }),
  component: ChatDetail,
});

function ChatDetail() {
  const { chatId } = Route.useParams();
  return (
    <AppShell title="ContextBell AI" subtitle="Answers grounded in your captured lecture">
      <ChatWorkspace chatId={chatId} />
    </AppShell>
  );
}
