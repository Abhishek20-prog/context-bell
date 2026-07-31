export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  joinedAt: string;
  avatarSeed: string;
  bio?: string;
};

export type Recording = {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  durationSec: number;
  transcript: string;
  status: "processing" | "ready" | "failed";
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  usedGeneralKnowledge?: boolean;
};

export type ChatSession = {
  id: string;
  title: string;
  recordingId: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export type Note = {
  id: string;
  title: string;
  content: string;
  source: "ai" | "manual";
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type Bookmark = {
  id: string;
  kind: "video" | "answer" | "link";
  title: string;
  subtitle?: string;
  url?: string;
  content?: string;
  createdAt: string;
};

export type StudyKit = {
  summary: string;
  revisionNotes: string[];
  importantQuestions: string[];
  mcqs: { question: string; options: string[]; answer: string }[];
  flashcards: { front: string; back: string }[];
  vivaQuestions: string[];
  interviewQuestions: string[];
  referenceBooks: { title: string; author: string; why: string }[];
  referenceVideos: { title: string; channel: string; query: string }[];
};

export type ActivityItem = {
  id: string;
  type: "recording" | "chat" | "note" | "video" | "auth";
  label: string;
  createdAt: string;
};

export type Settings = {
  theme: "light" | "dark";
  aiTone: "simple" | "balanced" | "exam";
  streamResponses: boolean;
  autoNotes: boolean;
};

export type LearningStats = {
  streak: number;
  minutes: number;
  lastActive: string;
  history: { date: string; minutes: number; chats: number }[];
};
