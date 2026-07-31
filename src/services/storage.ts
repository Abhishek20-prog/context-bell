import type { AppData, AppSettings, LearningProgress } from "@/types";

const KEY = "contextbell.v1";

export const defaultSettings: AppSettings = {
  theme: "dark",
  strictMode: false,
  autoStudyPack: false,
  preferredAI: "gemini",
  language: "English",
  transcriptLanguage: "Auto detect",
  voiceOutput: false,
  exportFormat: "pdf",
  defaultContextWindow: 30,
};

const defaultProgress: LearningProgress = {
  streak: 1,
  lastActiveDate: new Date().toISOString().slice(0, 10),
  topicsLearned: [],
  minutesStudied: 0,
  weekly: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
    day,
    doubts: 0,
    minutes: 0,
  })),
};

export const emptyData: AppData = {
  user: null,
  settings: defaultSettings,
  sessions: [],
  chats: [],
  notes: [],
  bookmarks: [],
  studyPacks: [],
  progress: defaultProgress,
  doubts: [],
};

/**
 * Local-storage backed repository. Every read/write of app state flows through
 * here, so swapping to a real API later only means re-implementing load/save.
 */
export function loadData(): AppData {
  if (typeof window === "undefined") return emptyData;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyData;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      ...emptyData,
      ...parsed,
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      progress: { ...defaultProgress, ...(parsed.progress ?? {}) },
    };
  } catch {
    return emptyData;
  }
}

export function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}
