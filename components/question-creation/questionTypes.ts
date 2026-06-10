export const QUESTION_OPTION_IDS = [
  "option1",
  "option2",
  "option3",
  "option4",
] as const;

export type QuestionOptionId = (typeof QUESTION_OPTION_IDS)[number];

export type QuestionOptionDraft = {
  id: QuestionOptionId;
  text: string;
};

export type QuestionDraft = {
  question: string;
  options: QuestionOptionDraft[];
  correctOptionId: QuestionOptionId | "";
  solution: string;
  difficulty: string;
  subjectId: string;
  topicId: string;
  subTopicId: string;
};

export function normalizeDifficultyValue(value: string) {
  const normalized = value.toLowerCase();

  if (normalized === "difficult") {
    return "hard";
  }

  return normalized;
}

export function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHtmlKeepMedia(value: string) {
  return value
    .replace(/<(?!\/?(img|br)\b)[^>]*>/gi, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createEmptyQuestionDraft(
  overrides?: Partial<QuestionDraft>,
): QuestionDraft {
  return {
    question: "<p></p>",
    options: QUESTION_OPTION_IDS.map((id) => ({ id, text: "" })),
    correctOptionId: "option2",
    solution: "",
    difficulty: "easy",
    subjectId: "",
    topicId: "",
    subTopicId: "",
    ...overrides,
  };
}

export function buildQuestionPayload(draft: QuestionDraft, testId: string) {
  const optionsById = Object.fromEntries(
    draft.options.map((option) => [option.id, option.text]),
  ) as Record<QuestionOptionId, string>;

  return {
    type: "mcq",
    question: draft.question,
    option1: stripHtml(optionsById.option1),
    option2: stripHtml(optionsById.option2),
    option3: stripHtml(optionsById.option3),
    option4: stripHtml(optionsById.option4),
    correct_option: draft.correctOptionId,
    explanation: draft.solution,
    difficulty: normalizeDifficultyValue(draft.difficulty),
    test_id: testId,
    subject: draft.subjectId,
  };
}
