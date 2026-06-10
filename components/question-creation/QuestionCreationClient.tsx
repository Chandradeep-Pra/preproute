"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import QuestionSidebar from "./QuestionSidebar";
import QuestionWorkspace from "./QuestionWorkspace";
import QuestionImportModal from "./QuestionImportModal";
import {
  buildQuestionPayload,
  createEmptyQuestionDraft,
  type QuestionDraft,
} from "./questionTypes";
import {
  buildImportQuestionPayload,
  importedRowToDraft,
  type ImportedQuestionRow,
} from "./questionImport";

function readNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatBackendErrors(errors: unknown) {
  if (!errors) {
    return "";
  }

  if (typeof errors === "string") {
    return errors;
  }

  if (Array.isArray(errors)) {
    return errors
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (entry && typeof entry === "object") {
          return Object.values(entry as Record<string, unknown>)
            .flat()
            .filter((value) => typeof value === "string")
            .join(", ");
        }

        return "";
      })
      .filter(Boolean)
      .join(" | ");
  }

  if (typeof errors === "object") {
    return Object.entries(errors as Record<string, unknown>)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.filter((item) => typeof item === "string").join(", ")}`;
        }

        if (typeof value === "string") {
          return `${key}: ${value}`;
        }

        return "";
      })
      .filter(Boolean)
      .join(" | ");
  }

  return "Validation failed.";
}

export default function QuestionCreationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId") ?? "";
  const [totalQuestions, setTotalQuestions] = useState(() =>
    readNumber(searchParams.get("totalQuestions") ?? searchParams.get("questions"), 1),
  );
  const [totalTime] = useState(() => readNumber(searchParams.get("totalTime"), 60));
  const [totalMarks, setTotalMarks] = useState(() =>
    readNumber(searchParams.get("totalMarks"), 250),
  );
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, QuestionDraft>>(() => ({
    1: createEmptyQuestionDraft({
      subjectId: searchParams.get("subjectId") ?? "",
      difficulty: searchParams.get("difficulty") ?? "easy",
      topicId: searchParams.get("topicId") ?? "",
      subTopicId: searchParams.get("subTopicId") ?? "",
    }),
  }));
  const [isSaving, setIsSaving] = useState(false);
  const subjectId = searchParams.get("subjectId") ?? "";
  const testName = searchParams.get("testName") ?? searchParams.get("name") ?? "";

  const getPreviewHref = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("testId", testId);
    return `/test-creation/question-creation/preview-publish?${nextParams.toString()}`;
  };

  const currentDraft =
    drafts[activeQuestion] ??
    createEmptyQuestionDraft({
      subjectId,
      difficulty: searchParams.get("difficulty") ?? "easy",
      topicId: searchParams.get("topicId") ?? "",
      subTopicId: searchParams.get("subTopicId") ?? "",
    });

  const updateCurrentDraft = (draft: QuestionDraft) => {
    setDrafts((current) => ({
      ...current,
      [activeQuestion]: draft,
    }));
  };

  const syncTotalParams = (nextQuestions: number, nextMarks: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("totalQuestions", String(nextQuestions));
    nextParams.set("questions", String(nextQuestions));
    nextParams.set("totalMarks", String(nextMarks));
    router.replace(`/test-creation/question-creation?${nextParams.toString()}`);
  };

  const handleIncreaseTotals = async (
    nextTotalQuestions: number,
    nextTotalMarks: number,
  ) => {
    const loadingToastId = toast.loading("Updating test size...");

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: testName,
          questions: [],
          total_questions: nextTotalQuestions,
          total_marks: nextTotalMarks,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        errors?: unknown;
      };

      if (!response.ok || !result.success) {
        const backendMessage = formatBackendErrors(result.errors);
        throw new Error(backendMessage || result.message || "Unable to update test.");
      }

      setTotalQuestions(nextTotalQuestions);
      setTotalMarks(nextTotalMarks);
      syncTotalParams(nextTotalQuestions, nextTotalMarks);

      toast.success("Test size updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update test.");
      throw error;
    } finally {
      toast.dismiss(loadingToastId);
    }
  };

  const handleImportRows = async (rows: ImportedQuestionRow[]) => {
    if (!testId) {
      toast.error("Test id is missing.");
      return;
    }

    const loadingToastId = toast.loading("Importing questions...");

    try {
      const response = await fetch("/api/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: rows.map((row) => buildImportQuestionPayload(row, testId, subjectId)),
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: unknown[];
        errors?: unknown;
      };

      if (!response.ok || !result.success) {
        const backendMessage = formatBackendErrors(result.errors);
        throw new Error(backendMessage || result.message || "Unable to import questions.");
      }

      const importedNumbers = rows.map((row) => row.questionNo);
      const nextCompletedQuestions = Array.from(
        new Set([...completedQuestions, ...importedNumbers]),
      ).sort((a, b) => a - b);

      setCompletedQuestions(nextCompletedQuestions);
      setDrafts((current) => {
        const next = { ...current };
        for (const row of rows) {
          next[row.questionNo] = importedRowToDraft(row, subjectId);
        }
        return next;
      });
      setActiveQuestion(Math.min(Math.max(...importedNumbers) + 1, totalQuestions));
      toast.success(result.message ?? "Questions imported successfully");
      setIsImportOpen(false);

      if (nextCompletedQuestions.length >= totalQuestions) {
        router.push(getPreviewHref());
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import questions.");
      throw error;
    } finally {
      toast.dismiss(loadingToastId);
    }
  };

  const handleSaveQuestion = async (draft: QuestionDraft) => {
    if (!testId) {
      toast.error("Test id is missing.");
      return;
    }

    const questionText = draft.question.replace(/<[^>]*>/g, "").trim();
    const optionTexts = draft.options.map((option) => option.text.trim());

    if (!questionText) {
      toast.error("Please add the question text.");
      return;
    }

    if (optionTexts.some((text) => !text)) {
      toast.error("Please fill all four options.");
      return;
    }

    if (!draft.correctOptionId) {
      toast.error("Please choose the correct option.");
      return;
    }

    const loadingToastId = toast.loading("Saving question...");

    try {
      setIsSaving(true);
      const payload = {
        questions: [buildQuestionPayload(draft, testId)],
      };

      const response = await fetch("/api/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: unknown[];
        errors?: unknown;
      };

      if (!response.ok || !result.success) {
        const backendMessage = formatBackendErrors(result.errors);
        throw new Error(backendMessage || result.message || "Unable to save question.");
      }

      toast.dismiss(loadingToastId);
      const nextCompletedQuestions = Array.from(
        new Set([...completedQuestions, activeQuestion]),
      ).sort((a, b) => a - b);

      setCompletedQuestions(nextCompletedQuestions);
      toast.success(
        nextCompletedQuestions.length >= totalQuestions
          ? "All questions completed. Moving to preview..."
          : "Question added successfully",
      );

      const nextQuestion = Math.min(activeQuestion + 1, totalQuestions);
      setActiveQuestion(nextQuestion);
      setDrafts((current) => ({
        ...current,
        [activeQuestion]: draft,
        [nextQuestion]:
          current[nextQuestion] ??
          createEmptyQuestionDraft({
            subjectId: searchParams.get("subjectId") ?? "",
            difficulty: searchParams.get("difficulty") ?? "easy",
            topicId: searchParams.get("topicId") ?? "",
            subTopicId: searchParams.get("subTopicId") ?? "",
          }),
      }));

      if (nextCompletedQuestions.length >= totalQuestions) {
        router.push(getPreviewHref());
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(error instanceof Error ? error.message : "Unable to save question.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="px-5 py-6 md:px-8 md:py-8">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <QuestionSidebar
          totalQuestions={totalQuestions}
          activeQuestion={activeQuestion}
          completedQuestions={completedQuestions}
          onSelectQuestion={setActiveQuestion}
        />

        <QuestionWorkspace
          key={`${testId}-${activeQuestion}`}
          subjectId={subjectId}
          topicId={searchParams.get("topicId") ?? ""}
          subTopicId={searchParams.get("subTopicId") ?? ""}
          testName={testName}
          subjectName={searchParams.get("subjectName") ?? ""}
          topicName={searchParams.get("topicName") ?? ""}
          subTopicName={searchParams.get("subTopicName") ?? ""}
          draft={currentDraft}
          onDraftChange={updateCurrentDraft}
          onSaveQuestion={handleSaveQuestion}
          onOpenImport={() => setIsImportOpen(true)}
          isSaving={isSaving}
          totalTime={totalTime}
          totalMarks={totalMarks}
          questionNumber={activeQuestion}
          totalQuestions={totalQuestions}
        />
      </div>

      <QuestionImportModal
        key={`${isImportOpen}-${totalQuestions}-${totalMarks}`}
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        templateHref="/question_book.xlsx"
        currentTotalQuestions={totalQuestions}
        currentTotalMarks={totalMarks}
        existingQuestionNumbers={completedQuestions}
        onIncreaseTotals={handleIncreaseTotals}
        onImportRows={handleImportRows}
      />
    </section>
  );
}
