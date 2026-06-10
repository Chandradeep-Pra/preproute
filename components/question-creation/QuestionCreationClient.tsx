"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import QuestionSidebar from "./QuestionSidebar";
import QuestionWorkspace from "./QuestionWorkspace";
import QuestionImportModal from "./QuestionImportModal";
import {
  buildQuestionPayload,
  createEmptyQuestionDraft,
  stripHtmlKeepMedia,
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

type QuestionRecord = Record<string, unknown> & { id?: string };

function readQuestionNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (value && typeof value === "object") {
    const record = value as QuestionRecord;
    return (
      readQuestionNumber(record.question_no) ??
      readQuestionNumber(record.questionNo) ??
      readQuestionNumber(record.question_number) ??
      readQuestionNumber(record.number) ??
      null
    );
  }

  return null;
}

async function loadExistingQuestions(testId: string) {
  const testResponse = await fetch(`/api/tests/${testId}`, { cache: "no-store" });
  const testPayload = (await testResponse.json()) as {
    success?: boolean;
    data?: { questions?: string[] };
    message?: string;
  };

  if (!testResponse.ok || !testPayload.success) {
    throw new Error(testPayload.message ?? "Unable to load test details.");
  }

  const questionIds = testPayload.data?.questions ?? [];

  if (questionIds.length === 0) {
    return [];
  }

  const questionResponse = await fetch("/api/questions/fetchBulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_ids: questionIds }),
  });

  const questionPayload = (await questionResponse.json()) as {
    success?: boolean;
    data?: QuestionRecord[];
    message?: string;
  };

  if (!questionResponse.ok || !questionPayload.success) {
    throw new Error(questionPayload.message ?? "Unable to load questions.");
  }

  return questionPayload.data ?? [];
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
  const existingQuestionsQuery = useQuery({
    queryKey: ["existing-test-questions", testId],
    queryFn: () => loadExistingQuestions(testId),
    enabled: Boolean(testId),
  });
  const existingQuestionMap = useMemo(() => {
    const map = new Map<
      number,
      {
        id: string;
        questionNo: number;
      }
    >();

    for (const question of existingQuestionsQuery.data ?? []) {
      const questionNo = readQuestionNumber(question);
      const id = typeof question.id === "string" ? question.id : "";

      if (questionNo && id) {
        map.set(questionNo, { id, questionNo });
      }
    }

    return map;
  }, [existingQuestionsQuery.data]);

  const allCompletedQuestionNumbers = useMemo(
    () =>
      Array.from(
        new Set([
          ...Array.from(existingQuestionMap.keys()),
          ...completedQuestions,
        ]),
      ).sort((a, b) => a - b),
    [completedQuestions, existingQuestionMap],
  );

  const getPreviewHref = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("testId", testId);
    return `/test-creation/question-creation/preview-publish?${nextParams.toString()}`;
  };

  const goToPreviewPublish = () => {
    if (!testId) {
      toast.error("Test id is missing.");
      return;
    }

    if (allCompletedQuestionNumbers.length < totalQuestions) {
      const shouldContinue = window.confirm(
        `Only ${allCompletedQuestionNumbers.length} of ${totalQuestions} questions are completed. Continue to preview and publish anyway?`,
      );

      if (!shouldContinue) {
        return;
      }
    }

    router.push(getPreviewHref());
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
      const sortedRows = [...rows].sort((a, b) => a.questionNo - b.questionNo);
      const rowsToUpdate = sortedRows.filter((row) => existingQuestionMap.has(row.questionNo));
      const rowsToCreate = sortedRows.filter((row) => !existingQuestionMap.has(row.questionNo));

      for (const row of rowsToUpdate) {
        const existingQuestion = existingQuestionMap.get(row.questionNo);
        if (!existingQuestion) {
          continue;
        }

        const updateResponse = await fetch(`/api/questions/${existingQuestion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildImportQuestionPayload(row, testId, subjectId)),
        });

        const updateResult = (await updateResponse.json()) as {
          success?: boolean;
          message?: string;
          errors?: unknown;
        };

        if (!updateResponse.ok || !updateResult.success) {
          const backendMessage = formatBackendErrors(updateResult.errors);
          throw new Error(backendMessage || updateResult.message || "Unable to update question.");
        }
      }

      if (rowsToCreate.length > 0) {
        const response = await fetch("/api/questions/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questions: rowsToCreate.map((row) =>
              buildImportQuestionPayload(row, testId, subjectId),
            ),
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

      }

      const importedNumbers = sortedRows.map((row) => row.questionNo);
      const nextCompletedQuestions = Array.from(
        new Set([...allCompletedQuestionNumbers, ...importedNumbers]),
      ).sort((a, b) => a - b);

      setCompletedQuestions(nextCompletedQuestions);
      setDrafts((current) => {
        const next = { ...current };
        for (const row of sortedRows) {
          next[row.questionNo] = importedRowToDraft(row, subjectId);
        }
        return next;
      });
      const nextQuestionNo = Math.max(...importedNumbers);
      setActiveQuestion(Math.min(nextQuestionNo + 1, totalQuestions));
      toast.success(
        rowsToUpdate.length > 0 && rowsToCreate.length > 0
          ? "Questions updated and imported successfully"
          : rowsToUpdate.length > 0
            ? "Questions updated successfully"
            : "Questions imported successfully",
      );
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

    const questionText = stripHtmlKeepMedia(draft.question);
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
        new Set([...allCompletedQuestionNumbers, activeQuestion]),
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
          completedQuestions={allCompletedQuestionNumbers}
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
          onPreviewPublish={goToPreviewPublish}
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
        existingQuestionNumbers={allCompletedQuestionNumbers}
        onIncreaseTotals={handleIncreaseTotals}
        onImportRows={handleImportRows}
      />
    </section>
  );
}
