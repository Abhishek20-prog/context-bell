import { useCallback, useEffect, useRef, useState } from "react";
import { db, logActivity, trackLearning, uid } from "@/lib/storage";
import { aiService } from "@/services/ai-service";
import type { ChatMessage, ChatSession, Recording, StudyKit } from "@/types";
import type { AiTone } from "@/services/ai-service";

export function useChat(sessionId: string | null, tone: AiTone) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [streaming, setStreaming] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "streaming">("idle");
  const [error, setError] = useState<string | null>(null);
  const [kits, setKits] = useState<Record<string, StudyKit>>({});
  const [kitLoading, setKitLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSessions(db.chats());
    const sync = () => setSessions(db.chats());
    window.addEventListener("contextbell:store", sync);
    return () => window.removeEventListener("contextbell:store", sync);
  }, []);

  const persist = useCallback((next: ChatSession[]) => {
    db.setChats(next);
    setSessions(next);
  }, []);

  const session = sessions.find((s) => s.id === sessionId) ?? null;
  const recordings: Recording[] = db.recordings();
  const transcript = session?.recordingId
    ? (recordings.find((r) => r.id === session.recordingId)?.transcript ?? null)
    : null;

  const createSession = useCallback(
    (recordingId: string | null = null, title = "New conversation") => {
      const created: ChatSession = {
        id: uid("chat"),
        title,
        recordingId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      persist([created, ...db.chats()]);
      return created;
    },
    [persist],
  );

  const patchSession = useCallback(
    (id: string, patch: Partial<ChatSession>) => {
      persist(
        db
          .chats()
          .map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s)),
      );
    },
    [persist],
  );

  const deleteSession = useCallback(
    (id: string) => persist(db.chats().filter((s) => s.id !== id)),
    [persist],
  );

  const send = useCallback(
    async (question: string) => {
      if (!session || !question.trim()) return;
      setError(null);
      const userMsg: ChatMessage = {
        id: uid("msg"),
        role: "user",
        content: question.trim(),
        createdAt: new Date().toISOString(),
      };
      const history = [...session.messages, userMsg];
      patchSession(session.id, {
        messages: history,
        title:
          session.messages.length === 0 && session.title === "New conversation"
            ? question.trim().slice(0, 48)
            : session.title,
      });

      setStatus("thinking");
      setStreaming("");
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const answer = await aiService.streamAnswer(
          {
            question: question.trim(),
            transcript,
            tone,
            history: session.messages.map((m) => ({ role: m.role, content: m.content })),
          },
          (chunk) => {
            setStatus("streaming");
            setStreaming((prev) => prev + chunk);
          },
          controller.signal,
        );

        const assistantMsg: ChatMessage = {
          id: uid("msg"),
          role: "assistant",
          content: answer,
          createdAt: new Date().toISOString(),
          usedGeneralKnowledge: answer.includes("extends beyond the recorded lecture"),
        };
        patchSession(session.id, { messages: [...history, assistantMsg] });
        logActivity("chat", `Asked: ${question.trim().slice(0, 60)}`);
        trackLearning(1, 1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "AI request failed");
        }
      } finally {
        setStreaming("");
        setStatus("idle");
        abortRef.current = null;
      }
    },
    [session, transcript, tone, patchSession],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const generateKit = useCallback(
    async (message: ChatMessage) => {
      const question =
        session?.messages
          .slice(
            0,
            session.messages.findIndex((m) => m.id === message.id),
          )
          .reverse()
          .find((m) => m.role === "user")?.content ?? "Explain this topic";
      setKitLoading(true);
      try {
        const kit = await aiService.studyKit({ transcript, question, answer: message.content });
        setKits((prev) => ({ ...prev, [message.id]: kit }));
        return kit;
      } finally {
        setKitLoading(false);
      }
    },
    [session, transcript],
  );

  return {
    sessions,
    session,
    transcript,
    recordings,
    streaming,
    status,
    error,
    kits,
    kitLoading,
    createSession,
    patchSession,
    deleteSession,
    send,
    stop,
    generateKit,
  };
}
