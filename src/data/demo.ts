import type { DoubtRecord } from "@/types";

export const teacherTopicDoubts = [
  { topic: "Process Scheduling", doubts: 42, unresolved: 9 },
  { topic: "React useEffect", doubts: 37, unresolved: 6 },
  { topic: "Gradient Descent", doubts: 31, unresolved: 11 },
  { topic: "TCP Congestion Control", doubts: 26, unresolved: 4 },
  { topic: "Dynamic Programming", doubts: 24, unresolved: 8 },
  { topic: "Virtual Memory Paging", doubts: 19, unresolved: 3 },
];

export const teacherTrend = [
  { week: "W1", doubts: 38, resolved: 30 },
  { week: "W2", doubts: 46, resolved: 35 },
  { week: "W3", doubts: 52, resolved: 44 },
  { week: "W4", doubts: 61, resolved: 50 },
  { week: "W5", doubts: 55, resolved: 49 },
  { week: "W6", doubts: 68, resolved: 61 },
];

export const teacherMisconceptions = [
  {
    topic: "Gradient Descent",
    summary:
      "Students frequently confuse the learning rate with the number of epochs, and assume a smaller learning rate always converges faster.",
    severity: "High",
  },
  {
    topic: "Process Scheduling",
    summary:
      "Round Robin and Priority Scheduling are often mixed up; many students believe preemption always reduces average waiting time.",
    severity: "High",
  },
  {
    topic: "React useEffect",
    summary:
      "The dependency array is read as a 'trigger list' rather than a comparison set, so cleanup functions are skipped.",
    severity: "Medium",
  },
  {
    topic: "TCP Congestion Control",
    summary:
      "Slow start is assumed to be slow in speed rather than slow in window growth.",
    severity: "Low",
  },
];

export const teacherSupportList = [
  { alias: "Student #A417", repeated: 7, unresolved: 4, topic: "Gradient Descent" },
  { alias: "Student #B902", repeated: 6, unresolved: 3, topic: "Process Scheduling" },
  { alias: "Student #C338", repeated: 5, unresolved: 3, topic: "Dynamic Programming" },
  { alias: "Student #D115", repeated: 4, unresolved: 2, topic: "React useEffect" },
];

export const demoDoubts: DoubtRecord[] = teacherTopicDoubts.slice(0, 4).map((t, i) => ({
  id: `demo_${i}`,
  topic: t.topic,
  question: `Sir, could you re-explain ${t.topic} with a simpler analogy?`,
  source: "offline",
  resolved: i % 2 === 0,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  studentAlias: `Student #${1000 + i}`,
}));

export const youtubeTopics = [
  { label: "React", query: "react js full course tutorial" },
  { label: "Operating Systems", query: "operating systems full course gate" },
  { label: "Machine Learning", query: "machine learning full course" },
  { label: "Network Theory", query: "network theory circuit analysis lecture" },
  { label: "DSA", query: "data structures and algorithms full course" },
  { label: "DBMS", query: "dbms full course lectures" },
  { label: "Digital Electronics", query: "digital electronics lectures" },
  { label: "Signals & Systems", query: "signals and systems lectures" },
];
