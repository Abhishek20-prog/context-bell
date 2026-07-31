import { AnimatePresence, motion } from "framer-motion";
import { Bell, Loader2, Radio, Square, X } from "lucide-react";
import { LECTURE_SOURCES, useContextBell } from "@/features/recording/ContextBellProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContextWindow } from "@/types";

const WINDOWS: ContextWindow[] = [20, 30, 45, 60];

export function FloatingContextBell() {
  const bell = useContextBell();

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {bell.panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="glass pointer-events-auto w-[22rem] rounded-3xl p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-sm font-semibold">ContextBell capture</p>
                <p className="text-xs text-muted-foreground">
                  {bell.listening ? `Buffering · ${bell.elapsed}s of lecture in memory` : "Pick your lecture source"}
                </p>
              </div>
              <button
                onClick={() => bell.setPanelOpen(false)}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Close capture panel"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-1.5">
              {LECTURE_SOURCES.filter((s) => s.mode !== "file").map((s) => (
                <button
                  key={s.id}
                  onClick={() => bell.startListening(s.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left transition-colors",
                    bell.source === s.id && bell.listening
                      ? "border-accent bg-accent/10"
                      : "border-border/60 hover:bg-muted/60",
                  )}
                >
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.hint}</p>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Context window</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {WINDOWS.map((w) => (
                  <button
                    key={w}
                    onClick={() => bell.setContextWindow(w)}
                    className={cn(
                      "rounded-xl border py-2 text-xs font-semibold transition-all",
                      bell.contextWindow === w
                        ? "gradient-gold border-transparent text-accent-foreground shadow-glow"
                        : "border-border/60 hover:bg-muted/60",
                    )}
                  >
                    {w}s
                  </button>
                ))}
              </div>
            </div>

            {bell.listening && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-8 flex-1 items-end gap-[3px]">
                  {Array.from({ length: 22 }).map((_, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-full bg-accent/70"
                      style={{
                        height: `${Math.max(8, Math.min(100, bell.level * 260 * (0.5 + Math.abs(Math.sin(i + bell.elapsed))))) }%`,
                        transition: "height 120ms linear",
                      }}
                    />
                  ))}
                </div>
                <Button size="sm" variant="secondary" onClick={bell.stopListening}>
                  <Square className="size-3.5" /> Stop
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto flex items-center gap-2">
        {bell.listening && (
          <span className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
            <Radio className="size-3.5 animate-pulse text-accent" />
            {bell.contextWindow}s window · live
          </span>
        )}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => (bell.listening ? bell.ring() : bell.setPanelOpen(!bell.panelOpen))}
          onContextMenu={(e) => {
            e.preventDefault();
            bell.setPanelOpen(!bell.panelOpen);
          }}
          disabled={bell.busy}
          aria-label="Ring ContextBell to capture lecture context"
          className={cn(
            "gradient-gold relative flex size-16 items-center justify-center rounded-full text-accent-foreground shadow-glow",
            bell.listening && "animate-bell-pulse",
          )}
        >
          {bell.busy ? <Loader2 className="size-7 animate-spin" /> : <Bell className="size-7" />}
        </motion.button>
      </div>
      {bell.listening && !bell.panelOpen && (
        <button
          onClick={() => bell.setPanelOpen(true)}
          className="pointer-events-auto text-[11px] text-muted-foreground underline decoration-dotted"
        >
          change context window
        </button>
      )}
    </div>
  );
}
