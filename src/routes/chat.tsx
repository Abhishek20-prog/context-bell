import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Check,
  MessageSquarePlus,
  Mic,
  Pencil,
  Search,
  Send,
  Square,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { EmptyState } from "@/components/ui-kit";
import { MessageBubble } from "@/features/chatbot/message-bubble";
import { useChat } from "@/features/chatbot/use-chat";
import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ session: z.string().optional() });

export const Route = createFileRoute("/chat")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Chatbot · ContextBell" },
      {
        name: "description",
        content:
          "Ask ContextBell anything about your recorded lecture — answers stay grounded in your transcript.",
      },
      { property: "og:title", content: "Chatbot · ContextBell" },
      { property: "og:description", content: "A ChatGPT-style tutor that knows your lecture." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "What did the teacher mean here?",
  "Explain this derivation step by step.",
  "Can you explain it in simpler language?",
  "Give me an exam-ready summary.",
];

function ChatPage() {
  const { session: sessionId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { settings } = useSettings();
  const chat = useChat(sessionId ?? null, settings.aiTone);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const busy = chat.status !== "idle";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.session?.messages.length, chat.streaming]);

  useEffect(() => {
    if (chat.error) toast.error(chat.error);
  }, [chat.error]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chat.sessions;
    return chat.sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q)),
    );
  }, [chat.sessions, query]);

  const newSession = (recordingId: string | null = null) => {
    const created = chat.createSession(recordingId);
    navigate({ search: { session: created.id } });
  };

  const submit = async (text: string) => {
    if (!text.trim() || busy) return;
    if (!chat.session) {
      const created = chat.createSession(chat.recordings[0]?.id ?? null, text.slice(0, 48));
      navigate({ search: { session: created.id } });
      setInput(text);
      toast.info("Started a new conversation — send again to ask.");
      return;
    }
    setInput("");
    await chat.send(text);
  };

  return (
    <AppShell
      title="ContextBell Chat"
      subtitle={
        chat.transcript
          ? "Answers grounded in your recorded lecture transcript"
          : "No recording attached — answers will come from general knowledge"
      }
    >
      <div className="flex h-[calc(100vh-4.25rem)] min-h-0">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border/60 p-4 md:flex">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search chats"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button size="icon" variant="outline" onClick={() => newSession()} aria-label="New chat">
              <MessageSquarePlus className="size-4" />
            </Button>
          </div>
          <div className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No conversations yet.
              </p>
            )}
            {filtered.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group rounded-xl border border-transparent px-3 py-2.5 transition-colors",
                  s.id === sessionId ? "border-border/60 bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                {renamingId === s.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          chat.patchSession(s.id, { title: renameValue || s.title });
                          setRenamingId(null);
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => {
                        chat.patchSession(s.id, { title: renameValue || s.title });
                        setRenamingId(null);
                      }}
                    >
                      <Check className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <button
                    className="w-full text-left"
                    onClick={() => navigate({ search: { session: s.id } })}
                  >
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.messages.length} messages
                      {s.recordingId ? " · 🎙️ context" : ""}
                    </p>
                  </button>
                )}
                <div className="mt-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label="Rename conversation"
                    onClick={() => {
                      setRenamingId(s.id);
                      setRenameValue(s.title);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label="Delete conversation"
                    onClick={() => {
                      chat.deleteSession(s.id);
                      if (s.id === sessionId) navigate({ search: {} });
                      toast.success("Conversation deleted");
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            <div className="mx-auto max-w-3xl space-y-5">
              {chat.session?.recordingId && (
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2">
                    <Mic className="size-4 text-primary" />
                    <p className="text-sm font-medium">Attached lecture context</p>
                    <Badge variant="outline" className="text-[10px]">
                      transcript-first
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                    {chat.transcript || "Transcript unavailable."}
                  </p>
                </div>
              )}

              {!chat.session || chat.session.messages.length === 0 ? (
                <EmptyState
                  icon={Brain}
                  title="Ask about your recorded lecture"
                  description="ContextBell answers from your transcript first and tells you clearly when it goes beyond it."
                />
              ) : (
                chat.session.messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    kit={chat.kits[m.id]}
                    kitLoading={chat.kitLoading}
                    onGenerateKit={() =>
                      chat
                        .generateKit(m)
                        .then(() => toast.success("Study kit ready"))
                        .catch((e: Error) => toast.error(e.message))
                    }
                  />
                ))
              )}

              <AnimatePresence>
                {busy && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-md bg-primary/15 text-primary">
                        <Brain className="size-3.5" />
                      </span>
                      <span className="animate-pulse text-xs text-muted-foreground">
                        {chat.status === "thinking" ? "Reading your transcript…" : "Answering…"}
                      </span>
                    </div>
                    {chat.streaming ? (
                      <Markdown>{chat.streaming}</Markdown>
                    ) : (
                      <div className="flex gap-1.5 pl-8">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="size-2 rounded-full bg-primary"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-border/60 px-4 py-4 sm:px-8 glass">
            <div className="mx-auto max-w-3xl">
              <div className="mb-2.5 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    disabled={busy}
                    className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(input);
                }}
                className="flex items-end gap-2 rounded-2xl border border-border/60 bg-card/60 p-2"
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the recording… (Shift + Enter for a new line)"
                  className="max-h-40 min-h-11 resize-none border-0 bg-transparent focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit(input);
                    }
                  }}
                />
                {busy ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={chat.stop}
                    aria-label="Stop"
                  >
                    <Square className="size-4" />
                  </Button>
                ) : (
                  <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send">
                    <Send className="size-4" />
                  </Button>
                )}
              </form>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
