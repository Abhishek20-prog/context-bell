import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { useRollingRecorder, type CaptureMode } from "@/features/recording/useRollingRecorder";
import { transcribeSegment } from "@/services/aiClient";
import { uid } from "@/services/storage";
import type { ChatThread, ContextWindow, LectureSession, LectureSource } from "@/types";

export const LECTURE_SOURCES: {
  id: LectureSource;
  label: string;
  hint: string;
  mode: CaptureMode | "file";
}[] = [
  { id: "offline", label: "Offline Classroom", hint: "Uses your microphone to hear the teacher", mode: "microphone" },
  { id: "youtube", label: "YouTube (in ContextBell)", hint: "Shares the video tab's audio", mode: "tab-audio" },
  { id: "google-meet", label: "Google Meet", hint: "Share the Meet tab with tab audio", mode: "tab-audio" },
  { id: "zoom", label: "Zoom", hint: "Share the Zoom window / system audio", mode: "tab-audio" },
  { id: "upload-audio", label: "Upload Audio", hint: "MP3, WAV, M4A lecture recording", mode: "file" },
  { id: "upload-video", label: "Upload Video", hint: "MP4 / WebM lecture recording", mode: "file" },
];

interface ContextBellValue {
  source: LectureSource;
  setSource: (s: LectureSource) => void;
  contextWindow: ContextWindow;
  setContextWindow: (w: ContextWindow) => void;
  listening: boolean;
  busy: boolean;
  level: number;
  elapsed: number;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  startListening: (source?: LectureSource) => Promise<void>;
  stopListening: () => void;
  ring: () => Promise<void>;
  captureFromFile: (file: File, window?: ContextWindow) => Promise<void>;
}

const Ctx = createContext<ContextBellValue | null>(null);

function titleFromTranscript(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "Lecture context";
  const words = clean.split(" ").slice(0, 8).join(" ");
  return words.length > 60 ? `${words.slice(0, 57)}…` : words;
}

export function ContextBellProvider({ children }: { children: ReactNode }) {
  const { settings, addSession, upsertChat, recordDoubt, trackStudy } = useApp();
  const navigate = useNavigate();
  const recorder = useRollingRecorder(150);

  const [source, setSource] = useState<LectureSource>("offline");
  const [contextWindow, setContextWindow] = useState<ContextWindow>(settings.defaultContextWindow);
  const [busy, setBusy] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const finalise = useCallback(
    async (transcript: string, usedSource: LectureSource, durationSec: number) => {
      if (!transcript.trim()) {
        toast.error("No speech detected in that segment. Try a longer context window.");
        return;
      }
      const topic = titleFromTranscript(transcript);
      const session: LectureSession = {
        id: uid("ses"),
        title: topic,
        source: usedSource,
        contextWindow: (durationSec as ContextWindow) ?? contextWindow,
        transcript,
        createdAt: new Date().toISOString(),
        durationSec,
        topic,
      };
      const chat: ChatThread = {
        id: uid("cht"),
        title: topic,
        sessionId: session.id,
        transcript,
        source: usedSource,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      session.chatId = chat.id;
      addSession(session);
      upsertChat(chat);
      recordDoubt({
        topic,
        question: "Context captured at moment of confusion",
        source: usedSource,
        resolved: false,
        studentAlias: "You",
      });
      trackStudy(Math.max(1, Math.round(durationSec / 60)), topic);
      setPanelOpen(false);
      toast.success("Lecture context captured — opening ContextBell AI");
      await navigate({ to: "/chat/$chatId", params: { chatId: chat.id } });
    },
    [addSession, contextWindow, navigate, recordDoubt, trackStudy, upsertChat],
  );

  const startListening = useCallback(
    async (next?: LectureSource) => {
      const chosen = next ?? source;
      const config = LECTURE_SOURCES.find((s) => s.id === chosen);
      if (!config || config.mode === "file") {
        toast.info("Upload a file from the Record Context page for this source.");
        return;
      }
      setSource(chosen);
      try {
        await recorder.start(config.mode);
        toast.success(
          config.mode === "tab-audio"
            ? "Listening to shared audio — ContextBell is buffering the lecture"
            : "Listening — ContextBell is buffering the lecture",
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not start listening");
      }
    },
    [recorder, source],
  );

  const ring = useCallback(async () => {
    if (!recorder.listening) {
      toast.error("Start listening to your lecture first.");
      setPanelOpen(true);
      return;
    }
    const blob = recorder.captureContext(contextWindow);
    if (!blob) {
      toast.error("Not enough buffered audio yet — give the lecture a few seconds.");
      return;
    }
    setBusy(true);
    try {
      const transcript = await transcribeSegment(
        blob,
        settings.transcriptLanguage === "Auto detect" ? undefined : settings.transcriptLanguage,
      );
      await finalise(transcript, source, contextWindow);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Capture failed");
    } finally {
      setBusy(false);
    }
  }, [contextWindow, finalise, recorder, settings.transcriptLanguage, source]);

  const captureFromFile = useCallback(
    async (file: File, window?: ContextWindow) => {
      setBusy(true);
      try {
        const transcript = await transcribeSegment(
          file,
          settings.transcriptLanguage === "Auto detect" ? undefined : settings.transcriptLanguage,
        );
        const usedSource: LectureSource = file.type.startsWith("video") ? "upload-video" : "upload-audio";
        await finalise(transcript, usedSource, window ?? contextWindow);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not process that file");
      } finally {
        setBusy(false);
      }
    },
    [contextWindow, finalise, settings.transcriptLanguage],
  );

  const value = useMemo<ContextBellValue>(
    () => ({
      source,
      setSource,
      contextWindow,
      setContextWindow,
      listening: recorder.listening,
      busy,
      level: recorder.level,
      elapsed: recorder.elapsed,
      panelOpen,
      setPanelOpen,
      startListening,
      stopListening: recorder.stop,
      ring,
      captureFromFile,
    }),
    [busy, captureFromFile, contextWindow, panelOpen, recorder.elapsed, recorder.level, recorder.listening, recorder.stop, ring, source, startListening],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContextBell() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useContextBell must be used inside ContextBellProvider");
  return ctx;
}
