export type Role = "student" | "teacher";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId: string;
  joinDate: string;
  avatar: string;
  institution?: string;
}

export type LectureSource =
  | "offline"
  | "youtube"
  | "google-meet"
  | "zoom"
  | "upload-audio"
  | "upload-video";

export type ContextWindow = 20 | 30 | 45 | 60;

export interface LectureSession {
  id: string;
  title: string;
  source: LectureSource;
  contextWindow: ContextWindow;
  transcript: string;
  createdAt: string;
  durationSec: number;
  topic?: string;
  chatId?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  usedGeneralKnowledge?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  sessionId?: string;
  transcript?: string;
  source?: LectureSource;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  sessionId?: string;
}

export interface Bookmark {
  id: string;
  title: string;
  kind: "chat" | "note" | "video" | "study-pack";
  refId?: string;
  url?: string;
  createdAt: string;
}

export const STUDY_PACK_SECTIONS = [
  "Detailed Notes",
  "Mind Map",
  "Topic Summary",
  "Key Concepts",
  "Important Formulas",
  "Practice Questions",
  "MCQs",
  "Subjective Questions",
  "Viva Questions",
  "Interview Questions",
  "Previous Year Question Patterns",
  "Flashcards",
  "Quick Revision Sheet",
  "One-Page Cheat Sheet",
  "Recommended Books",
  "Recommended Chapters",
  "Recommended YouTube Videos",
  "Learning Roadmap",
] as const;

export type StudyPackSection = (typeof STUDY_PACK_SECTIONS)[number];

export interface StudyPack {
  id: string;
  title: string;
  topic: string;
  sections: string[];
  markdown: string;
  createdAt: string;
  sessionId?: string;
  difficulty?: string;
  estimatedStudyTime?: string;
}

export interface AppSettings {
  theme: "light" | "dark";
  strictMode: boolean;
  autoStudyPack: boolean;
  preferredAI: string;
  language: string;
  transcriptLanguage: string;
  voiceOutput: boolean;
  exportFormat: "pdf" | "markdown";
  defaultContextWindow: ContextWindow;
}

export interface LearningProgress {
  streak: number;
  lastActiveDate: string;
  topicsLearned: string[];
  minutesStudied: number;
  weekly: { day: string; doubts: number; minutes: number }[];
}

export interface DoubtRecord {
  id: string;
  topic: string;
  question: string;
  source: LectureSource;
  resolved: boolean;
  createdAt: string;
  studentAlias: string;
}

export interface AppData {
  user: User | null;
  settings: AppSettings;
  sessions: LectureSession[];
  chats: ChatThread[];
  notes: Note[];
  bookmarks: Bookmark[];
  studyPacks: StudyPack[];
  progress: LearningProgress;
  doubts: DoubtRecord[];
}
