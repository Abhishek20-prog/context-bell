import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/context/settings-context";
import { KEYS } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · ContextBell" },
      {
        name: "description",
        content: "Tune ContextBell's answer tone, appearance and stored study data.",
      },
      { property: "og:title", content: "Settings · ContextBell" },
      {
        property: "og:description",
        content: "Control tone, theme and local study data in ContextBell.",
      },
    ],
  }),
  component: SettingsPage,
});

const TONES = [
  { id: "simple", label: "Simple", hint: "Plain language, everyday analogies" },
  { id: "balanced", label: "Balanced", hint: "Clear explanation with the right rigour" },
  { id: "exam", label: "Exam-focused", hint: "Definitions, keywords and marking points" },
] as const;

function SettingsPage() {
  const { settings, update, toggleTheme } = useSettings();

  return (
    <AppShell title="Settings" subtitle="Tune how ContextBell explains things to you">
      <div className="mx-auto max-w-2xl space-y-5">
        <section className="glass-card p-6">
          <h2 className="text-sm font-semibold">Answer tone</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Applied to every AI answer and study kit you generate.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => update({ aiTone: t.id })}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  settings.aiTone === t.id
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/60 hover:bg-secondary/60",
                )}
              >
                <p className="text-sm font-medium">{t.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="glass-card space-y-5 p-6">
          <h2 className="text-sm font-semibold">Experience</h2>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm">Appearance</Label>
              <p className="text-xs text-muted-foreground">
                Currently using {settings.theme} mode.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={toggleTheme}>
              {settings.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              Switch
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="stream" className="text-sm">
                Stream responses
              </Label>
              <p className="text-xs text-muted-foreground">
                Show answers word-by-word as they arrive.
              </p>
            </div>
            <Switch
              id="stream"
              checked={settings.streamResponses}
              onCheckedChange={(v) => update({ streamResponses: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="autonotes" className="text-sm">
                Suggest notes automatically
              </Label>
              <p className="text-xs text-muted-foreground">
                Offer a revision note after each generated study kit.
              </p>
            </div>
            <Switch
              id="autonotes"
              checked={settings.autoNotes}
              onCheckedChange={(v) => update({ autoNotes: v })}
            />
          </div>
        </section>

        <section className="glass-card p-6">
          <h2 className="text-sm font-semibold">Study data</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Recordings, chats, notes and bookmarks are stored on this device only.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2 text-destructive"
            onClick={() => {
              [
                KEYS.recordings,
                KEYS.chats,
                KEYS.notes,
                KEYS.bookmarks,
                KEYS.activity,
                KEYS.stats,
              ].forEach((k) => localStorage.removeItem(k));
              window.dispatchEvent(new CustomEvent("contextbell:store"));
              toast.success("Study data cleared");
            }}
          >
            <Trash2 className="size-4" /> Clear study data
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
