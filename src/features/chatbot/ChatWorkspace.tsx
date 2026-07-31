import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Loader2,
  Mic,
  MicOff,
  NotebookPen,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/Markdown";
import { StudyPackDialog } from "@/features/studyPack/StudyPackDialog";
import { useApp } from "@/context/AppContext";
import { streamChat, generateStudyPack } from "@/services/aiClient";
import { uid } from "@/services/storage";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatThread } from "@/types";

const SUGGESTIONS = [
  "What did the teacher mean here?",
  "Explain this like I'm a beginner",
  "Give me a real-life analogy",
  "Which formula applies and why?",
  "What mistakes do students make here?",
];

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
}

export function ChatWorkspace({ chatId }: { chatId?: string }) {
  const { data, settings, upsertChat, deleteChat, addNote, addStudyPack } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [packFor, setPackFor] = useState<{ topic: string; transcript?: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = useMemo(() => data.chats.find((c) => c.id === chatId) ?? null, [chatId, data.chats]);
  const filteredChats = useMemo(
    () =>
      data.chats.filter((c) =>
        search.trim()
          ? c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.messages.some((m) => m.content.toLowerCase().includes(search.toLowerCase()))
          : true,
      ),
    [data.chats, search],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat?.messages.length, draft]);

  const newChat = () => {
    const created: ChatThread = {
      id: uid("cht"),
      title: "New conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    upsertChat(created);
    navigate({ to: "/chat/$chatId", params: { chatId: created.id } });
  };

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text.replace(/[#*`>|-]/g, "").slice(0, 900)));
  };

  const toggleVoiceInput = () => {
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setInput((prev) => `${prev} ${text}`.trim());
    };
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    let active = chat;
    if (!active) {
      active = {
        id: uid("cht"),
        title: content.slice(0, 40),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      upsertChat(active);
      navigate({ to: "/chat/$chatId", params: { chatId: active.id } });
    }

    const userMessage: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const withUser: ChatThread = {
      ...active,
      title: active.messages.length === 0 ? content.slice(0, 46) : active.title,
      messages: [...active.messages, userMessage],
      updatedAt: new Date().toISOString(),
    };
    upsertChat(withUser);
    setInput("");
    setStreaming(true);
    setDraft("");

    let full = "";
    try {
      full = await streamChat(
        {
          messages: withUser.messages.map((m) => ({ role: m.role, content: m.content })),
          ...(withUser.transcript ? { transcript: withUser.transcript } : {}),
          ...(withUser.source ? { source: withUser.source } : {}),
          strictMode: settings.strictMode,
          language: settings.language,
          preferredAI: settings.preferredAI,
        },
        (delta) => setDraft((prev) => prev + delta),
      );

      const assistant: ChatMessage = {
        id: uid("msg"),
        role: "assistant",
        content: full,
        createdAt: new Date().toISOString(),
        usedGeneralKnowledge: full.includes("extends beyond your recorded lecture context"),
      };
      upsertChat({
        ...withUser,
        messages: [...withUser.messages, assistant],
        updatedAt: new Date().toISOString(),
      });
      if (settings.voiceOutput) speak(full);

      if (settings.autoStudyPack) {
        toast.info("Auto Study Pack is on — generating…");
        const markdown = await generateStudyPack({
          topic: withUser.title,
          ...(withUser.transcript ? { transcript: withUser.transcript } : {}),
          sections: ["Topic Summary", "Detailed Notes", "Key Concepts", "MCQs", "Flashcards", "Quick Revision Sheet"],
          strictMode: settings.strictMode,
          language: settings.language,
          preferredAI: settings.preferredAI,
        });
        addStudyPack({
          id: uid("pack"),
          title: `Study Pack — ${withUser.title}`,
          topic: withUser.title,
          sections: ["Auto generated"],
          markdown,
          createdAt: new Date().toISOString(),
          ...(withUser.sessionId ? { sessionId: withUser.sessionId } : {}),
        });
        toast.success("Study Pack saved automatically");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The AI could not respond");
    } finally {
      setStreaming(false);
      setDraft("");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[17rem_1fr]">
      <aside className="glass hidden h-[calc(100vh-9.5rem)] flex-col rounded-3xl p-3 lg:flex">
        <Button onClick={newChat} className="w-full">
          <Plus className="size-4" /> New chat
        </Button>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className="pl-9"
          />
        </div>
        <ScrollArea className="mt-3 flex-1">
          <div className="space-y-1 pr-2">
            {filteredChats.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                No chats yet. Ring the ContextBell during a lecture to start one.
              </p>
            )}
            {filteredChats.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center gap-1 rounded-xl px-2 py-2 text-sm transition-colors",
                  c.id === chatId ? "bg-primary/12 text-primary" : "hover:bg-muted/70",
                )}
              >
                <Link
                  to="/chat/$chatId"
                  params={{ chatId: c.id }}
                  className="flex-1 truncate text-left"
                  title={c.title}
                >
                  {c.title}
                </Link>
                <button
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Rename chat"
                  onClick={() => {
                    const next = window.prompt("Rename chat", c.title);
                    if (next?.trim()) upsertChat({ ...c, title: next.trim() });
                  }}
                >
                  <Pencil className="size-3.5 text-muted-foreground" />
                </button>
                <button
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Delete chat"
                  onClick={() => {
                    deleteChat(c.id);
                    if (c.id === chatId) navigate({ to: "/chat" });
                  }}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <section className="glass flex h-[calc(100vh-9.5rem)] flex-col rounded-3xl">
        {chat?.transcript && (
          <div className="border-b border-border/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
              Captured lecture context · {chat.source ?? "lecture"}
            </p>
            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{chat.transcript}</p>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {!chat || chat.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="gradient-gold flex size-14 items-center justify-center rounded-2xl shadow-glow">
                <Sparkles className="size-6 text-accent-foreground" />
              </span>
              <h2 className="font-display text-xl font-semibold">Ask about your lecture</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                {chat?.transcript
                  ? "Your lecture context is loaded. Ask anything about this moment."
                  : "Ring the ContextBell during a lecture for grounded answers, or ask a question now."}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border/60 px-3 py-1.5 text-xs transition-colors hover:bg-muted/70"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {chat.messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      m.role === "user"
                        ? "gradient-hero text-primary-foreground"
                        : "border border-border/60 bg-card",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <>
                        <Markdown>{m.content}</Markdown>
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                          <Button
                            size="sm"
                            onClick={() =>
                              setPackFor({
                                topic: chat.title,
                                ...(chat.transcript ? { transcript: chat.transcript } : {}),
                              })
                            }
                          >
                            <BookOpen className="size-3.5" /> Generate Study Pack
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              addNote({
                                id: uid("note"),
                                title: chat.title,
                                body: m.content,
                                tags: ["ai", "lecture"],
                                createdAt: new Date().toISOString(),
                                ...(chat.sessionId ? { sessionId: chat.sessionId } : {}),
                              });
                              toast.success("Saved to Notes");
                            }}
                          >
                            <NotebookPen className="size-3.5" /> Save as note
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => speak(m.content)}>
                            <Volume2 className="size-3.5" /> Listen
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm">{m.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {streaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl border border-border/60 bg-card px-4 py-3">
                {draft ? (
                  <Markdown>{`${draft}▌`}</Markdown>
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/60 p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask what the teacher meant…"
              className="max-h-40 min-h-[3rem] resize-none"
            />
            <Button variant={recording ? "destructive" : "secondary"} size="icon" onClick={toggleVoiceInput}>
              {recording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </Button>
            <Button size="icon" onClick={() => send()} disabled={streaming || !input.trim()}>
              {streaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Transcript-first answers · Strict Mode {settings.strictMode ? "ON" : "OFF"} · Auto Study Pack{" "}
            {settings.autoStudyPack ? "ON" : "OFF"}
          </p>
        </div>
      </section>

      {packFor && (
        <StudyPackDialog
          open
          onOpenChange={(o) => !o && setPackFor(null)}
          topic={packFor.topic}
          {...(packFor.transcript ? { transcript: packFor.transcript } : {})}
          {...(chat?.sessionId ? { sessionId: chat.sessionId } : {})}
        />
      )}
    </div>
  );
}
