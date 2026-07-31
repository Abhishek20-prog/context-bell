export const MODEL = "gemini-2.5-flash";


export type ToneKey = "simple" | "balanced" | "exam";

const TONES: Record<ToneKey, string> = {
  simple: "Explain in very simple, friendly language a first-year student can follow.",
  balanced: "Explain clearly and precisely, balancing intuition with rigour.",
  exam: "Explain in an exam-focused way: crisp definitions, steps, and scoring points.",
};

const BASE_RULES = `You are ContextBell, an AI learning assistant for students.

ABSOLUTE CONTEXT RULES:
1. The recorded lecture transcript below is your primary source of truth. Always answer from it first, quoting or paraphrasing what the teacher actually said.
2. Use general knowledge ONLY when the transcript is insufficient or missing.
3. Whenever you rely on general knowledge, you MUST include this exact sentence on its own line: "This explanation extends beyond the recorded lecture."
4. Never invent content and attribute it to the recording.

STYLE: Markdown with short paragraphs, headings, bullet lists, code blocks when useful, and LaTeX math delimited by $...$ or $$...$$.`;

export function buildChatMessages(input: {
  question: string;
  transcript: string | null;
  history: { role: "user" | "assistant"; content: string }[];
  tone: ToneKey;
}) {
  const transcriptBlock = input.transcript?.trim()
    ? `RECORDED LECTURE TRANSCRIPT:\n"""\n${input.transcript.trim().slice(0, 12000)}\n"""`
    : `RECORDED LECTURE TRANSCRIPT: (none attached — the student has not recorded context for this session. Answer from general knowledge and state that the explanation extends beyond the recorded lecture.)`;

  return [
    {
      role: "system" as const,
      content: `${BASE_RULES}\n\n${TONES[input.tone]}\n\n${transcriptBlock}`,
    },
    ...input.history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: input.question },
  ];
}

export const STUDY_KIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "revisionNotes",
    "importantQuestions",
    "mcqs",
    "flashcards",
    "vivaQuestions",
    "interviewQuestions",
    "referenceBooks",
    "referenceVideos",
  ],
  properties: {
    summary: { type: "string" },
    revisionNotes: { type: "array", items: { type: "string" } },
    importantQuestions: { type: "array", items: { type: "string" } },
    mcqs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "options", "answer"],
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          answer: { type: "string" },
        },
      },
    },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["front", "back"],
        properties: { front: { type: "string" }, back: { type: "string" } },
      },
    },
    vivaQuestions: { type: "array", items: { type: "string" } },
    interviewQuestions: { type: "array", items: { type: "string" } },
    referenceBooks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "author", "why"],
        properties: {
          title: { type: "string" },
          author: { type: "string" },
          why: { type: "string" },
        },
      },
    },
    referenceVideos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "channel", "query"],
        properties: {
          title: { type: "string" },
          channel: { type: "string" },
          query: { type: "string" },
        },
      },
    },
  },
} as const;

export function buildStudyKitMessages(input: {
  transcript: string | null;
  question: string;
  answer: string;
}) {
  return [
    {
      role: "system" as const,
      content: `You generate structured study material for a student, grounded first in their recorded lecture transcript. Return JSON only, matching the requested schema. Provide 4-6 revision notes, 4 important questions, 3 MCQs (4 options each), 4 flashcards, 3 viva questions, 3 interview questions, 2-3 reference books and 3 reference video search topics.`,
    },
    {
      role: "user" as const,
      content: `TRANSCRIPT:\n${input.transcript?.slice(0, 8000) || "(none)"}\n\nSTUDENT QUESTION:\n${input.question}\n\nAI EXPLANATION:\n${input.answer.slice(0, 6000)}`,
    },
  ];
}
