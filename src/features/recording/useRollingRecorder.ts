import { useCallback, useEffect, useRef, useState } from "react";
import { encodeWav } from "@/utils/wav";

export type CaptureMode = "microphone" | "tab-audio";

/**
 * Keeps a rolling audio buffer in memory. Nothing is uploaded until the student
 * rings the ContextBell — then we slice the last N seconds surrounding that
 * moment of confusion and hand it to the transcription service.
 */
export function useRollingRecorder(maxSeconds = 120) {
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const samplesRef = useRef(0);
  const startedAt = useRef(0);

  const stop = useCallback(() => {
    nodeRef.current?.disconnect();
    ctxRef.current?.close().catch(() => undefined);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    nodeRef.current = null;
    ctxRef.current = null;
    streamRef.current = null;
    setListening(false);
    setLevel(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    if (!listening) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 500);
    return () => clearInterval(id);
  }, [listening]);

  const start = useCallback(
    async (mode: CaptureMode) => {
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
      } catch (e) {
        const message = e instanceof Error ? e.message : "Could not access audio";
        setError(message);
        throw new Error(message);
      }
    },
    [maxSeconds, stop],
  );

  /** Slice the trailing `seconds` of the rolling buffer around this moment. */
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

  return { listening, level, elapsed, error, start, stop, captureContext };
}
