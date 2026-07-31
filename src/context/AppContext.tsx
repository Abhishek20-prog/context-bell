import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadData, saveData, uid, emptyData } from "@/services/storage";
import { demoDoubts } from "@/data/demo";
import type {
  AppData,
  AppSettings,
  Bookmark,
  ChatThread,
  DoubtRecord,
  LectureSession,
  Note,
  Role,
  StudyPack,
  User,
} from "@/types";

interface AppContextValue {
  data: AppData;
  hydrated: boolean;
  user: User | null;
  settings: AppSettings;
  signIn: (input: { name: string; email: string; role: Role; institution?: string }) => User;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  addSession: (session: LectureSession) => void;
  upsertChat: (chat: ChatThread) => void;
  deleteChat: (id: string) => void;
  addNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  toggleBookmark: (bookmark: Omit<Bookmark, "id" | "createdAt">) => void;
  addStudyPack: (pack: StudyPack) => void;
  deleteStudyPack: (id: string) => void;
  recordDoubt: (doubt: Omit<DoubtRecord, "id" | "createdAt">) => void;
  trackStudy: (minutes: number, topic?: string) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadData();
    if (loaded.doubts.length === 0) loaded.doubts = demoDoubts;
    setData(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveData(data);
  }, [data, hydrated]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", data.settings.theme === "dark");
  }, [data.settings.theme]);

  const patch = useCallback((updater: (prev: AppData) => AppData) => setData(updater), []);

  const signIn = useCallback<AppContextValue["signIn"]>(
    ({ name, email, role, institution }) => {
      const user: User = {
        id: uid("usr"),
        name,
        email,
        role,
        studentId: role === "student" ? `CB-${Math.floor(100000 + Math.random() * 899999)}` : `FAC-${Math.floor(1000 + Math.random() * 8999)}`,
        joinDate: new Date().toISOString(),
        avatar: name
          .split(" ")
          .map((p) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        ...(institution ? { institution } : {}),
      };
      patch((prev) => ({
        ...prev,
        user,
        progress: { ...prev.progress, lastActiveDate: todayKey(), streak: Math.max(1, prev.progress.streak) },
      }));
      return user;
    },
    [patch],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      hydrated,
      user: data.user,
      settings: data.settings,
      signIn,
      signOut: () => patch((prev) => ({ ...prev, user: null })),
      updateUser: (p) => patch((prev) => (prev.user ? { ...prev, user: { ...prev.user, ...p } } : prev)),
      updateSettings: (p) => patch((prev) => ({ ...prev, settings: { ...prev.settings, ...p } })),
      addSession: (session) => patch((prev) => ({ ...prev, sessions: [session, ...prev.sessions].slice(0, 60) })),
      upsertChat: (chat) =>
        patch((prev) => {
          const exists = prev.chats.some((c) => c.id === chat.id);
          return {
            ...prev,
            chats: exists ? prev.chats.map((c) => (c.id === chat.id ? chat : c)) : [chat, ...prev.chats],
          };
        }),
      deleteChat: (id) => patch((prev) => ({ ...prev, chats: prev.chats.filter((c) => c.id !== id) })),
      addNote: (note) => patch((prev) => ({ ...prev, notes: [note, ...prev.notes] })),
      deleteNote: (id) => patch((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) })),
      toggleBookmark: (bookmark) =>
        patch((prev) => {
          const found = prev.bookmarks.find(
            (b) => b.kind === bookmark.kind && (b.refId === bookmark.refId || b.url === bookmark.url),
          );
          if (found) return { ...prev, bookmarks: prev.bookmarks.filter((b) => b.id !== found.id) };
          return {
            ...prev,
            bookmarks: [{ ...bookmark, id: uid("bm"), createdAt: new Date().toISOString() }, ...prev.bookmarks],
          };
        }),
      addStudyPack: (pack) => patch((prev) => ({ ...prev, studyPacks: [pack, ...prev.studyPacks] })),
      deleteStudyPack: (id) => patch((prev) => ({ ...prev, studyPacks: prev.studyPacks.filter((p) => p.id !== id) })),
      recordDoubt: (doubt) =>
        patch((prev) => ({
          ...prev,
          doubts: [{ ...doubt, id: uid("dbt"), createdAt: new Date().toISOString() }, ...prev.doubts],
        })),
      trackStudy: (minutes, topic) =>
        patch((prev) => {
          const dayIndex = (new Date().getDay() + 6) % 7;
          const weekly = prev.progress.weekly.map((w, i) =>
            i === dayIndex ? { ...w, minutes: w.minutes + minutes, doubts: w.doubts + 1 } : w,
          );
          const isNewDay = prev.progress.lastActiveDate !== todayKey();
          return {
            ...prev,
            progress: {
              ...prev.progress,
              weekly,
              minutesStudied: prev.progress.minutesStudied + minutes,
              streak: isNewDay ? prev.progress.streak + 1 : prev.progress.streak,
              lastActiveDate: todayKey(),
              topicsLearned:
                topic && !prev.progress.topicsLearned.includes(topic)
                  ? [topic, ...prev.progress.topicsLearned].slice(0, 40)
                  : prev.progress.topicsLearned,
            },
          };
        }),
      reset: () => {
        setData({ ...emptyData, doubts: demoDoubts });
      },
    }),
    [data, hydrated, patch, signIn],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
