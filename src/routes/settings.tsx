import { createFileRoute } from "@tanstack/react-router";
import { Moon, ShieldCheck, Sparkles, Sun, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import type { ContextWindow } from "@/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Strict Mode, Auto Study Pack & More" },
      {
        name: "description",
        content:
          "Control Strict Mode, Automatic Study Packs, preferred AI, languages, voice output and export defaults.",
      },
      { property: "og:title", content: "Settings — ContextBell" },
      { property: "og:description", content: "Tune how ContextBell explains your lectures." },
    ],
  }),
  component: SettingsPage,
});

const LANGUAGES = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Tamil", "Bengali"];
const TRANSCRIPT_LANGUAGES = ["Auto detect", "en", "hi", "es", "fr", "de", "ta", "bn"];
const AI_OPTIONS = [
  { id: "gemini", label: "Gemini Flash (fast, default)" },
  { id: "gemini-pro", label: "Gemini Pro (deeper reasoning)" },
];
const WINDOWS: ContextWindow[] = [20, 30, 45, 60];

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-4">
      <div className="max-w-md">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { settings, updateSettings } = useApp();

  return (
    <AppShell title="Settings" subtitle="Every preference is stored locally on this device">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass space-y-3 rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">Appearance</h2>
          <Row title="Theme" description="Switch between light and dark mode.">
            <div className="flex gap-2">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium capitalize transition-all",
                    settings.theme === t
                      ? "border-accent bg-accent/10 shadow-glow"
                      : "border-border/60 hover:bg-muted/60",
                  )}
                >
                  {t === "light" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                  {t}
                </button>
              ))}
            </div>
          </Row>
        </div>

        <div className="glass space-y-3 rounded-3xl p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            <ShieldCheck className="size-4 text-accent" /> AI behaviour
          </h2>
          <Row
            title="Strict Mode"
            description="Explain only the captured lecture topic plus one closely related supporting concept."
          >
            <Switch
              checked={settings.strictMode}
              onCheckedChange={(v) => updateSettings({ strictMode: v })}
            />
          </Row>
          <Row
            title="Automatic Study Pack"
            description="Every AI explanation instantly generates and saves a study pack."
          >
            <Switch
              checked={settings.autoStudyPack}
              onCheckedChange={(v) => updateSettings({ autoStudyPack: v })}
            />
          </Row>
          <Row title="Voice Output" description="Read AI answers aloud automatically.">
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-muted-foreground" />
              <Switch
                checked={settings.voiceOutput}
                onCheckedChange={(v) => updateSettings({ voiceOutput: v })}
              />
            </div>
          </Row>
        </div>

        <div className="glass space-y-3 rounded-3xl p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            <Sparkles className="size-4 text-accent" /> Models & languages
          </h2>
          <Row title="Preferred AI" description="The AI layer is modular — swap models any time.">
            <Select value={settings.preferredAI} onValueChange={(v) => updateSettings({ preferredAI: v })}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row title="Answer language" description="The language ContextBell explains in.">
            <Select value={settings.language} onValueChange={(v) => updateSettings({ language: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row title="Transcript language" description="Language hint for speech-to-text.">
            <Select
              value={settings.transcriptLanguage}
              onValueChange={(v) => updateSettings({ transcriptLanguage: v })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSCRIPT_LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
        </div>

        <div className="glass space-y-3 rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">Capture & export</h2>
          <Row title="Default context window" description="Used when you ring the bell.">
            <div className="flex gap-2">
              {WINDOWS.map((w) => (
                <button
                  key={w}
                  onClick={() => updateSettings({ defaultContextWindow: w })}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                    settings.defaultContextWindow === w
                      ? "gradient-gold border-transparent text-accent-foreground"
                      : "border-border/60 hover:bg-muted/60",
                  )}
                >
                  {w}s
                </button>
              ))}
            </div>
          </Row>
          <Row title="Export preference" description="Default format for study pack downloads.">
            <div className="flex gap-2">
              {(["pdf", "markdown"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => updateSettings({ exportFormat: f })}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-semibold uppercase transition-all",
                    settings.exportFormat === f
                      ? "border-accent bg-accent/10"
                      : "border-border/60 hover:bg-muted/60",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </Row>
          <Label className="text-[11px] text-muted-foreground">
            Nothing leaves your device except the audio segment you explicitly capture.
          </Label>
        </div>
      </div>
    </AppShell>
  );
}
