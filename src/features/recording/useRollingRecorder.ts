import { useCallback, useEffect, useRef, useState } from "react";
import { encodeWav } from "@/utils/wav";

export type CaptureMode = "microphone" | "tab-audio";

interface SpeechRecognitionResultItem {
  transcript: string;
}
interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
    isFinal: boolean;
  };
  length: number;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent {
  error: string;
}
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechEntry {
  text: string;
  ts: number;
}

/**
 * Keeps a rolling audio buffer and live browser speech recognition in memory.
 * Uses the browser's built-in Web Speech API (100% free, zero external API keys).
 * When the student rings the ContextBell, we extract the trailing speech transcript
 * captured during that exact lecture window.
 */
export function useRollingRecorder(maxSeconds = 150) {
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const samplesRef = useRef(0);
  const startedAt = useRef(0);

  // Live browser speech recognition state
  const speechLogRef = useRef<SpeechEntry[]>([]);
  const interimTextRef = useRef<string>("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldListenRef = useRef<boolean>(false);

  // Check Web Speech API availability on mount
  useEffect(() => {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechSupported(!!SR);
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  }, []);

  const startSpeechRecognition = useCallback((lang?: string) => {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setSpeechSupported(false);
      return;
    }

    stopSpeechRecognition();
    shouldListenRef.current = true;

    try {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = lang && lang !== "Auto detect" ? lang : "en-US";

      rec.onresult = (e: SpeechRecognitionEvent) => {
        let currentInterim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (!res) continue;
          const transcriptText = res[0]?.transcript?.trim() ?? "";
          if (!transcriptText) continue;

          if (res.isFinal) {
            speechLogRef.current.push({ text: transcriptText, ts: Date.now() });
            // Clean up old log entries past maxSeconds
            const cutoff = Date.now() - maxSeconds * 1000;
            speechLogRef.current = speechLogRef.current.filter((entry) => entry.ts >= cutoff);
          } else {
            currentInterim = transcriptText;
          }
        }
        interimTextRef.current = currentInterim;
      };

      rec.onend = () => {
        // Auto-restart if recording is still active
        if (shouldListenRef.current) {
          try {
            rec.start();
          } catch {
            /* ignore restart errors */
          }
        }
      };

      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        console.warn("Browser SpeechRecognition notice:", e.error);
      };

      recognitionRef.current = rec;
      speechLogRef.current = [];
      interimTextRef.current = "";
      rec.start();
    } catch (err) {
      console.warn("Could not start Web Speech Recognition:", err);
    }
  }, [maxSeconds, stopSpeechRecognition]);

  const stop = useCallback(() => {
    stopSpeechRecognition();
    nodeRef.current?.disconnect();
    ctxRef.current?.close().catch(() => undefined);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    nodeRef.current = null;
    ctxRef.current = null;
    streamRef.current = null;
    setListening(false);
    setLevel(0);
  }, [stopSpeechRecognition]);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    if (!listening) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 500);
    return () => clearInterval(id);
  }, [listening]);

  const start = useCallback(
    async (mode: CaptureMode, lang?: string) => {
      setError(null);
      try {
        const stream =
          mode === "tab-audio"
            ? await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: { echoCancellation: false, noiseSuppression: false },
              })
            : await navigator.mediaDevices.getUserMedia({ audio: true });

        if (mode === "tab-audio" && stream.getAudioTracks().length === 0) {
          stream.getTracks().forEach((t) => t.stop());
          throw new Error(
            'No audio track shared. Re-share and enable "Also share tab audio" / "Share system audio".',
          );
        }

        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const node = ctx.createScriptProcessor(4096, 1, 1);
        const maxSamples = maxSeconds * ctx.sampleRate;

        chunksRef.current = [];
        samplesRef.current = 0;

        node.onaudioprocess = (e) => {
          const input = new Float32Array(e.inputBuffer.getChannelData(0));
          chunksRef.current.push(input);
          samplesRef.current += input.length;
          while (samplesRef.current > maxSamples && chunksRef.current.length > 1) {
            const removed = chunksRef.current.shift();
            samplesRef.current -= removed?.length ?? 0;
          }
          let peak = 0;
          for (let i = 0; i < input.length; i += 64) peak = Math.max(peak, Math.abs(input[i] ?? 0));
          setLevel(peak);
        };

        source.connect(node);
        node.connect(ctx.destination);

        stream.getTracks()[0]?.addEventListener("ended", () => stop());

        streamRef.current = stream;
        ctxRef.current = ctx;
        nodeRef.current = node;
        startedAt.current = Date.now();
        setElapsed(0);
        setListening(true);

        // Start Browser Speech Recognition in parallel
        startSpeechRecognition(lang);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Could not access audio";
        setError(message);
        throw new Error(message);
      }
    },
    [maxSeconds, startSpeechRecognition, stop],
  );

  /** Slice the trailing `seconds` of the rolling audio buffer around this moment. */
  const captureContext = useCallback((seconds: number): Blob | null => {
    const ctx = ctxRef.current;
    if (!ctx) return null;
    const wanted = seconds * ctx.sampleRate;
    const picked: Float32Array[] = [];
    let count = 0;
    for (let i = chunksRef.current.length - 1; i >= 0 && count < wanted; i--) {
      const chunk = chunksRef.current[i];
      if (!chunk) continue;
      picked.unshift(chunk);
      count += chunk.length;
    }
    if (count < ctx.sampleRate * 1.5) return null;
    return encodeWav(picked, ctx.sampleRate);
  }, []);

  /**
   * Retrieves the speech transcript collected by the browser's Web Speech API
   * during the last `seconds` window.
   */
  const captureTranscript = useCallback((seconds: number): string => {
    const cutoff = Date.now() - seconds * 1000;
    const pastFinals = speechLogRef.current
      .filter((e) => e.ts >= cutoff)
      .map((e) => e.text);

    const parts = [...pastFinals];
    if (interimTextRef.current && !parts.includes(interimTextRef.current)) {
      parts.push(interimTextRef.current);
    }

    return parts.join(" ").trim();
  }, []);

  return {
    listening,
    level,
    elapsed,
    error,
    speechSupported,
    start,
    stop,
    captureContext,
    captureTranscript,
  };
}

