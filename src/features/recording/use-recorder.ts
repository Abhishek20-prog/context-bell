import { useCallback, useEffect, useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "paused" | "stopped";

/** Records mic audio as PCM and encodes a complete 16kHz mono WAV file. */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    nodeRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    nodeRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      chunksRef.current = [];
      pausedRef.current = false;
      node.onaudioprocess = (e) => {
        if (pausedRef.current) return;
        const data = new Float32Array(e.inputBuffer.getChannelData(0));
        chunksRef.current.push(data);
        let peak = 0;
        for (let i = 0; i < data.length; i += 32) peak = Math.max(peak, Math.abs(data[i] ?? 0));
        setLevel(peak);
      };
      source.connect(node);
      node.connect(ctx.destination);
      sourceRef.current = source;
      nodeRef.current = node;
      setSeconds(0);
      setState("recording");
      timerRef.current = setInterval(() => {
        if (!pausedRef.current) setSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError("Microphone access is needed to record your lecture context.");
      setState("idle");
    }
  }, []);

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setState(pausedRef.current ? "paused" : "recording");
  }, []);

  const stop = useCallback(async (): Promise<{ blob: Blob; durationSec: number } | null> => {
    const ctx = ctxRef.current;
    const sampleRate = ctx?.sampleRate ?? 48000;
    cleanup();
    setState("stopped");
    setLevel(0);
    const blob = encodeWav(chunksRef.current, sampleRate);
    await ctx?.close();
    ctxRef.current = null;
    if (blob.size < 2048) {
      setError("That recording was empty — please try again.");
      return null;
    }
    return { blob, durationSec: seconds };
  }, [cleanup, seconds]);

  const reset = useCallback(() => {
    chunksRef.current = [];
    setSeconds(0);
    setState("idle");
    setError(null);
  }, []);

  return { state, seconds, level, error, start, stop, togglePause, reset };
}

function encodeWav(chunks: Float32Array[], sampleRate: number, targetRate = 16000): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  const ratio = sampleRate / targetRate;
  const outLength = Math.floor(merged.length / ratio);
  const samples = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const s = Math.max(-1, Math.min(1, merged[Math.floor(i * ratio)] ?? 0));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (pos: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(pos + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  new Int16Array(buffer, 44).set(samples);
  return new Blob([buffer], { type: "audio/wav" });
}

export const formatDuration = (sec: number) =>
  `${Math.floor(sec / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(sec % 60)
    .toString()
    .padStart(2, "0")}`;
