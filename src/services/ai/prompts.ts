/**
 * Server-side prompt builder for ContextBell.
 *
 * The transcript captured around the student's moment of confusion always has
 * the highest priority. General knowledge may only extend the answer, and must
 * be explicitly flagged.
 */

export interface PromptOptions {
  transcript?: string | undefined;
  strictMode?: boolean | undefined;
  language?: string | undefined;
  source?: string | undefined;
}

const DISCLAIMER = "This explanation extends beyond your recorded lecture context.";

export function buildSystemPrompt(opts: PromptOptions) {
  const { transcript, strictMode, language = "English", source } = opts;

  const contextBlock = transcript?.trim()
    ? `LECTURE TRANSCRIPT (captured around the student's moment of confusion${
        source ? `, source: ${source}` : ""
      }):\n"""\n${transcript.trim()}\n"""`
    : "LECTURE TRANSCRIPT: (none captured yet — tell the student to capture context with the ContextBell button for a lecture-grounded answer, then help as best you can.)";

  return `You are ContextBell, a contextual learning assistant for students. You are NOT a generic chatbot.

${contextBlock}

ANSWERING RULES (in strict priority order):
1. Ground every answer in the lecture transcript above. Quote or paraphrase what the teacher actually said.
2. Interpret the teacher's intent, including anything implied but not said clearly.
3. Only if the transcript is insufficient, extend with general knowledge — and when you do, add a clearly separated line in bold: **${DISCLAIMER}**
4. Never contradict the transcript.

${
  strictMode
    ? "STRICT MODE IS ON: explain ONLY the captured lecture topic plus at most ONE closely related supporting concept. Do not expand into unrelated concepts, tangents or extra topics. Keep the student focused."
    : "Strict mode is off: you may enrich the answer with related concepts once the lecture topic is fully covered."
}

RESPONSE STRUCTURE (use markdown headings, skip a section only when genuinely irrelevant):
## What the teacher explained
## Hidden meaning / what was implied
## Simple explanation
## Beginner view
## Advanced view
## Real-life analogy
## Formulas${strictMode ? "" : "\n## Visual explanation (describe an ASCII/diagram sketch)"}
## Practical applications
## Common mistakes
## Exam tips

Reply in ${language}. Be precise, warm and encouraging. Use markdown, LaTeX-style math where useful, and code blocks for code.`;
}

export function buildStudyPackPrompt(params: {
  transcript?: string | undefined;
  topic: string;
  sections: string[];
  strictMode?: boolean | undefined;
  language?: string | undefined;
}) {
  const { transcript, topic, sections, strictMode, language = "English" } = params;
  return `You are ContextBell's Study Pack generator. Build a complete, exam-ready study pack in MARKDOWN, generated specifically FROM the captured lecture context below.

TOPIC: ${topic}

LECTURE TRANSCRIPT:
"""
${transcript?.trim() || "(no transcript captured — rely on general knowledge and note it)"}
"""

Include EXACTLY these sections, each as a "## " heading, in this order:
${sections.map((s) => `- ${s}`).join("\n")}

Also always end with:
## Difficulty Level
## Estimated Study Time

Rules:
- The transcript has highest priority. Where you must go beyond it, add the line **${DISCLAIMER}** inside that section.
${strictMode ? "- STRICT MODE: stay on the lecture topic plus at most one closely related supporting concept.\n" : ""}- Mind maps must be rendered as nested markdown bullet trees.
- Flashcards as a markdown table with "Front | Back".
- MCQs with 4 options and the answer marked.
- Be rich and specific, never generic filler.
- Write in ${language}.`;
}
