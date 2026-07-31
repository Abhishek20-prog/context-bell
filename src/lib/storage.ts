import type {
  ActivityItem,
  Bookmark,
  ChatSession,
  LearningStats,
  Note,
  Recording,
  Settings,
  User,
} from "@/types";

const PREFIX = "contextbell:";

export const KEYS = {
  users: `${PREFIX}users`,
  session: `${PREFIX}session`,
  recordings: `${PREFIX}recordings`,
  chats: `${PREFIX}chats`,
  notes: `${PREFIX}notes`,
  bookmarks: `${PREFIX}bookmarks`,
  activity: `${PREFIX}activity`,
  settings: `${PREFIX}settings`,
  stats: `${PREFIX}stats`,
} as const;

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("contextbell:store", { detail: key }));
  } catch {
    /* quota errors ignored in MVP */
  }
}

export const uid = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

export const db = {
  users: () => readStore<User[]>(KEYS.users, []),
  setUsers: (v: User[]) => writeStore(KEYS.users, v),
  sessionUserId: () => readStore<string | null>(KEYS.session, null),
  setSessionUserId: (v: string | null) => writeStore(KEYS.session, v),
  recordings: () => readStore<Recording[]>(KEYS.recordings, []),
  setRecordings: (v: Recording[]) => writeStore(KEYS.recordings, v),
  chats: () => readStore<ChatSession[]>(KEYS.chats, []),
  setChats: (v: ChatSession[]) => writeStore(KEYS.chats, v),
  notes: () => readStore<Note[]>(KEYS.notes, []),
  setNotes: (v: Note[]) => writeStore(KEYS.notes, v),
  bookmarks: () => readStore<Bookmark[]>(KEYS.bookmarks, []),
  setBookmarks: (v: Bookmark[]) => writeStore(KEYS.bookmarks, v),
  activity: () => readStore<ActivityItem[]>(KEYS.activity, []),
  setActivity: (v: ActivityItem[]) => writeStore(KEYS.activity, v),
  settings: () =>
    readStore<Settings>(KEYS.settings, {
      theme: "dark",
      aiTone: "balanced",
      streamResponses: true,
      autoNotes: true,
    }),
  setSettings: (v: Settings) => writeStore(KEYS.settings, v),
  stats: () =>
    readStore<LearningStats>(KEYS.stats, {
      streak: 1,
      minutes: 0,
      lastActive: new Date().toISOString(),
      history: [],
    }),
  setStats: (v: LearningStats) => writeStore(KEYS.stats, v),
};

export function logActivity(type: ActivityItem["type"], label: string) {
  const next: ActivityItem[] = [
    { id: uid("act"), type, label, createdAt: new Date().toISOString() },
    ...db.activity(),
  ].slice(0, 40);
  db.setActivity(next);
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function trackLearning(minutes: number, chats = 0) {
  const stats = db.stats();
  const today = dayKey(new Date());
  const history = [...stats.history];
  const idx = history.findIndex((h) => h.date === today);
  if (idx >= 0) {
    history[idx] = {
      ...history[idx],
      minutes: history[idx].minutes + minutes,
      chats: history[idx].chats + chats,
    };
  } else {
    history.push({ date: today, minutes, chats });
  }

  const last = stats.lastActive ? dayKey(new Date(stats.lastActive)) : null;
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  let streak = stats.streak || 1;
  if (last !== today) streak = last === yesterday ? streak + 1 : 1;

  db.setStats({
    streak,
    minutes: Math.round((stats.minutes + minutes) * 10) / 10,
    lastActive: new Date().toISOString(),
    history: history.slice(-30),
  });
}
