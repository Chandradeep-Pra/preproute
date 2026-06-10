import * as XLSX from "xlsx";
import {
  type QuestionDraft,
  type QuestionOptionId,
  QUESTION_OPTION_IDS,
  normalizeDifficultyValue,
} from "./questionTypes";

export type ImportedQuestionRow = {
  questionNo: number;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: QuestionOptionId;
  explanation: string;
  difficulty: string;
};

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function toText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function toNumber(value: unknown) {
  const parsed = Number(toText(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCorrectOption(value: unknown): QuestionOptionId | "" {
  const raw = normalizeKey(toText(value));

  if (raw === "1" || raw === "option1") return "option1";
  if (raw === "2" || raw === "option2") return "option2";
  if (raw === "3" || raw === "option3") return "option3";
  if (raw === "4" || raw === "option4") return "option4";

  return "";
}

function normalizeDifficulty(value: unknown) {
  const raw = normalizeKey(toText(value));

  if (raw === "easy") return "easy";
  if (raw === "medium") return "medium";
  if (raw === "difficult" || raw === "hard") return "hard";

  return "easy";
}

function getNormalizedValue(record: Record<string, unknown>, keys: string[]) {
  for (const [key, value] of Object.entries(record)) {
    if (keys.includes(normalizeKey(key))) {
      return value;
    }
  }

  return "";
}

export async function parseQuestionWorkbook(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  return rows
    .map((row, index) => {
      const questionNo = toNumber(
        getNormalizedValue(row, ["questionno", "questionnumber", "qno"]),
      );

      const imported: ImportedQuestionRow = {
        questionNo: questionNo ?? index + 1,
        question: toText(getNormalizedValue(row, ["question"])),
        option1: toText(getNormalizedValue(row, ["option1"])),
        option2: toText(getNormalizedValue(row, ["option2"])),
        option3: toText(getNormalizedValue(row, ["option3"])),
        option4: toText(getNormalizedValue(row, ["option4"])),
        correctOption: normalizeCorrectOption(
          getNormalizedValue(row, ["correctoption", "correct_option"]),
        ) || "option2",
        explanation: toText(getNormalizedValue(row, ["explanation", "solution"])),
        difficulty: normalizeDifficultyValue(
          normalizeDifficulty(getNormalizedValue(row, ["difficulty"])),
        ),
      };

      return imported;
    })
    .filter((row) => Boolean(row.question))
    .sort((a, b) => a.questionNo - b.questionNo);
}

export function importedRowToDraft(
  row: ImportedQuestionRow,
  subjectId: string,
): QuestionDraft {
  return {
    question: row.question,
    options: QUESTION_OPTION_IDS.map((id) => ({
      id,
      text: row[id],
    })),
    correctOptionId: row.correctOption,
    solution: row.explanation,
    difficulty: row.difficulty,
    subjectId,
    topicId: "",
    subTopicId: "",
  };
}

export function buildImportQuestionPayload(
  row: ImportedQuestionRow,
  testId: string,
  subjectId: string,
) {
  return {
    type: "mcq",
    question: row.question,
    option1: row.option1,
    option2: row.option2,
    option3: row.option3,
    option4: row.option4,
    correct_option: row.correctOption,
    explanation: row.explanation,
    difficulty: row.difficulty,
    test_id: testId,
    subject: subjectId,
  };
}
