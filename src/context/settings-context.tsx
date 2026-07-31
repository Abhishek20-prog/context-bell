import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { db } from "@/lib/storage";
import type { Settings } from "@/types";

type Ctx = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  toggleTheme: () => void;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    theme: "dark",
    aiTone: "balanced",
    streamResponses: true,
    autoNotes: true,
  });

  useEffect(() => {
    setSettings(db.settings());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      db.setSettings(next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(
    () => update({ theme: settings.theme === "dark" ? "light" : "dark" }),
    [settings.theme, update],
  );

  const value = useMemo(() => ({ settings, update, toggleTheme }), [settings, update, toggleTheme]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
