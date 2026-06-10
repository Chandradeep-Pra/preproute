"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import type { SelectOption } from "./api";
import { fetchSubjects, fetchSubTopics, fetchTopics } from "./api";
import DifficultySelector from "./DifficultySelector";
import FormField from "./FormField";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import MarkingScheme, { type MarkingSchemeState } from "./MarkingScheme";

type FieldMessage = {
  text: string;
  type: "error" | "loading";
};

type ChapterWiseFormState = {
  subjectId: string;
  topicId: string;
  subTopicId: string;
  testName: string;
  duration: string;
  difficulty: string;
  marking: MarkingSchemeState;
};

type ChapterWiseErrors = Partial<Record<keyof ChapterWiseFormState, string>>;
type TestDetailRecord = Record<string, unknown>;

const TEST_TYPE = "chapterwise";

function normalizeDifficultyForUi(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "hard") {
    return "difficult";
  }

  return normalized || "easy";
}

function normalizeDifficultyForPayload(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "difficult") {
    return "hard";
  }

  return normalized || "easy";
}

function buildInitialState(searchParams: ReturnType<typeof useSearchParams>): ChapterWiseFormState {
  return {
    subjectId: searchParams.get("subjectId") ?? "",
    topicId: searchParams.get("topicId") ?? "",
    subTopicId: searchParams.get("subTopicId") ?? "",
    testName: searchParams.get("testName") ?? "",
    duration: searchParams.get("duration") ?? "",
    difficulty: normalizeDifficultyForUi(searchParams.get("difficulty") ?? "easy"),
    marking: {
      wrongAnswer: searchParams.get("wrongMarks") ?? "-1",
      unattempted: searchParams.get("unattemptMarks") ?? "0",
      correctAnswer: searchParams.get("correctMarks") ?? "5",
      noOfQuestions: searchParams.get("totalQuestions") ?? "",
      totalMarks: searchParams.get("totalMarks") ?? "",
    },
  };
}

function readString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      readString(record.id) ||
      readString(record.name) ||
      readString(record.subject_id) ||
      readString(record.topic_id) ||
      readString(record.sub_topic_id)
    );
  }

  return "";
}

function readNumberString(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "";
}

function readArrayItem(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) {
    return "";
  }

  const first = value[0];

  if (typeof first === "string") {
    return first;
  }

  if (first && typeof first === "object") {
    const record = first as Record<string, unknown>;
    return readString(record.id) || readString(record.name);
  }

  return "";
}

function normalizeWrongAnswer(value: unknown): string {
  const raw = readNumberString(value);
  if (!raw) {
    return "";
  }

  const parsed = Number(raw);

  if (Number.isNaN(parsed)) {
    return raw;
  }

  return parsed === 0 ? "0" : `-${Math.abs(parsed)}`;
}

function resolveOptionId(options: SelectOption[] | undefined, candidate: unknown): string {
  const raw = readString(candidate).trim();
  if (!raw) {
    return "";
  }

  const normalized = raw.toLowerCase();

  return (
    options?.find((option) =>
      option.id.toLowerCase() === normalized ||
      option.name.toLowerCase() === normalized,
    )?.id ?? ""
  );
}

function mapDetailToState(
  detail: TestDetailRecord,
  current: ChapterWiseFormState,
  subjects: SelectOption[] | undefined,
  topics: SelectOption[] | undefined,
  subTopics: SelectOption[] | undefined,
) {
  const subjectCandidate = detail.subject_id ?? detail.subject ?? "";
  const topicCandidate =
    detail.topic_id ?? detail.topic ?? readArrayItem(detail.topics) ?? "";
  const subTopicCandidate =
    detail.sub_topic_id ?? detail.subTopic_id ?? readArrayItem(detail.sub_topics) ?? "";

  const mappedSubjectId = resolveOptionId(subjects, subjectCandidate) || current.subjectId;
  const mappedTopicId = resolveOptionId(topics, topicCandidate) || current.topicId;
  const mappedSubTopicId =
    resolveOptionId(subTopics, subTopicCandidate) || current.subTopicId;
  const mappedTestName = readString(detail.name) || current.testName;
  const mappedDuration =
    readNumberString(detail.total_time) ||
    readNumberString(detail.duration) ||
    current.duration;
  const mappedDifficulty = normalizeDifficultyForUi(
    readString(detail.difficulty) || current.difficulty || "easy",
  );
  const mappedWrongAnswer =
    normalizeWrongAnswer(detail.wrong_marks ?? detail.wrongAnswer) ||
    current.marking.wrongAnswer;
  const mappedUnattempted =
    readNumberString(detail.unattempt_marks) ||
    readNumberString(detail.unattempted) ||
    current.marking.unattempted;
  const mappedCorrectAnswer =
    readNumberString(detail.correct_marks) ||
    readNumberString(detail.correctAnswer) ||
    current.marking.correctAnswer;
  const mappedNoOfQuestions =
    readNumberString(detail.total_questions) ||
    readNumberString(detail.noOfQuestions) ||
    current.marking.noOfQuestions;
  const mappedTotalMarks =
    readNumberString(detail.total_marks) ||
    readNumberString(detail.totalMarks) ||
    current.marking.totalMarks;

  console.log("TEST DETAIL FIELD MAP", {
    subjectCandidate,
    topicCandidate,
    subTopicCandidate,
    mappedSubjectId,
    mappedTopicId,
    mappedSubTopicId,
    mappedTestName,
    mappedDuration,
    mappedDifficulty,
    mappedWrongAnswer,
    mappedUnattempted,
    mappedCorrectAnswer,
    mappedNoOfQuestions,
    mappedTotalMarks,
    subjectOptions: subjects?.map((option) => option.id),
    topicOptions: topics?.map((option) => option.id),
    subTopicOptions: subTopics?.map((option) => option.id),
  });

  return {
    subjectId: mappedSubjectId,
    topicId: mappedTopicId,
    subTopicId: mappedSubTopicId,
    testName: mappedTestName,
    duration: mappedDuration,
    difficulty: mappedDifficulty,
    marking: {
      wrongAnswer: mappedWrongAnswer,
      unattempted: mappedUnattempted,
      correctAnswer: mappedCorrectAnswer,
      noOfQuestions: mappedNoOfQuestions,
      totalMarks: mappedTotalMarks,
    },
  };
}

function summarizeState(state: ChapterWiseFormState) {
  return {
    subjectId: state.subjectId,
    topicId: state.topicId,
    subTopicId: state.subTopicId,
    testName: state.testName,
    duration: state.duration,
    difficulty: state.difficulty,
    wrongAnswer: state.marking.wrongAnswer,
    unattempted: state.marking.unattempted,
    correctAnswer: state.marking.correctAnswer,
    noOfQuestions: state.marking.noOfQuestions,
    totalMarks: state.marking.totalMarks,
  };
}

function statesEqual(a: ChapterWiseFormState, b: ChapterWiseFormState) {
  return (
    a.subjectId === b.subjectId &&
    a.topicId === b.topicId &&
    a.subTopicId === b.subTopicId &&
    a.testName === b.testName &&
    a.duration === b.duration &&
    a.difficulty === b.difficulty &&
    a.marking.wrongAnswer === b.marking.wrongAnswer &&
    a.marking.unattempted === b.marking.unattempted &&
    a.marking.correctAnswer === b.marking.correctAnswer &&
    a.marking.noOfQuestions === b.marking.noOfQuestions &&
    a.marking.totalMarks === b.marking.totalMarks
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
        if (typeof entry === "string") return entry;
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

function getOptionName(options: { id: string; name: string }[] | undefined, id: string) {
  return options?.find((option) => option.id === id)?.name ?? "";
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateState(state: ChapterWiseFormState) {
  const errors: ChapterWiseErrors = {};

  if (!state.subjectId) errors.subjectId = "Subject is required.";
  if (!state.topicId) errors.topicId = "Topic is required.";
  if (!state.subTopicId) errors.subTopicId = "Sub Topic is required.";
  if (!state.testName.trim()) errors.testName = "Name of Test is required.";
  if (!state.duration.trim()) errors.duration = "Duration is required.";

  if (!state.marking.wrongAnswer.trim()) {
    errors.marking = "Fill the marking scheme values.";
  } else if (
    !state.marking.unattempted.trim() ||
    !state.marking.correctAnswer.trim() ||
    !state.marking.noOfQuestions.trim() ||
    !state.marking.totalMarks.trim()
  ) {
    errors.marking = "Fill the marking scheme values.";
  }

  return errors;
}

export default function ChapterWiseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState(() => buildInitialState(searchParams));
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const testId = searchParams.get("testId") ?? "";

    console.log("CHAPTER WISE FORM INIT", {
      testId,
    initialState: summarizeState(buildInitialState(searchParams)),
    searchParams: Object.fromEntries(searchParams.entries()),
  });

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
  });

  const topicsQuery = useQuery({
    queryKey: ["topics", state.subjectId],
    queryFn: () => fetchTopics(state.subjectId),
    enabled: Boolean(state.subjectId),
  });

  const subTopicsQuery = useQuery({
    queryKey: ["sub-topics", state.topicId],
    queryFn: () => fetchSubTopics(state.topicId),
    enabled: Boolean(state.topicId),
  });

  const testDetailQuery = useQuery({
    queryKey: ["test-detail", testId],
    queryFn: async () => {
      console.log("TEST DETAIL QUERY START", { testId });
      const response = await fetch(`/api/tests/${testId}`, { cache: "no-store" });
      const payload = (await response.json()) as {
        success?: boolean;
        status?: string;
        data?: TestDetailRecord;
        message?: string;
      };

      console.log("TEST DETAIL QUERY RESPONSE", {
        testId,
        status: response.status,
        ok: response.ok,
        payload,
      });

      const isSuccessful = payload.success === true || payload.status === "success";

      if (!response.ok || !isSuccessful || !payload.data) {
        throw new Error(payload.message ?? "Unable to load test.");
      }

      return payload.data;
    },
    enabled: Boolean(testId),
  });

  const errors = useMemo(() => validateState(state), [state]);

  useEffect(() => {
    if (!testDetailQuery.data) {
      return;
    }

    const mappedState = mapDetailToState(
      testDetailQuery.data,
      state,
      subjectsQuery.data,
      topicsQuery.data,
      subTopicsQuery.data,
    );

    console.log("TEST DETAIL HYDRATION", {
      testId,
      rawDetail: testDetailQuery.data,
      currentState: summarizeState(state),
      mappedState: summarizeState(mappedState),
      subjects: subjectsQuery.data,
      topics: topicsQuery.data,
      subTopics: subTopicsQuery.data,
    });

    const timeoutId = window.setTimeout(() => {
      setState((current) => {
        const next = mapDetailToState(
          testDetailQuery.data,
          current,
          subjectsQuery.data,
          topicsQuery.data,
          subTopicsQuery.data,
        );

        return statesEqual(current, next) ? current : next;
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    subTopicsQuery.data,
    subjectsQuery.data,
    testDetailQuery.data,
    topicsQuery.data,
    state,
    testId,
  ]);

  useEffect(() => {
    console.log("CHAPTER WISE FORM STATE", summarizeState(state));
  }, [state]);

  const subjectMessage: FieldMessage | undefined = subjectsQuery.isLoading
    ? { text: "Loading subjects", type: "loading" }
    : subjectsQuery.isError
      ? {
          text: getErrorMessage(
            subjectsQuery.error,
            "Unable to load subjects.",
          ),
          type: "error",
        }
      : submitAttempted && errors.subjectId
        ? { text: errors.subjectId, type: "error" }
        : undefined;

  const topicMessage: FieldMessage | undefined = !state.subjectId
    ? submitAttempted
      ? { text: "Please select a subject first.", type: "error" }
      : undefined
    : topicsQuery.isLoading
      ? { text: "Loading topics", type: "loading" }
      : topicsQuery.isError
        ? {
            text: getErrorMessage(topicsQuery.error, "Unable to load topics."),
            type: "error",
          }
        : submitAttempted && errors.topicId
          ? { text: errors.topicId, type: "error" }
          : undefined;

  const subTopicMessage: FieldMessage | undefined = !state.subjectId
    ? undefined
    : !state.topicId
      ? submitAttempted
        ? { text: "Please select a topic first.", type: "error" }
        : undefined
      : subTopicsQuery.isLoading
        ? { text: "Loading sub-topics", type: "loading" }
        : subTopicsQuery.isError
          ? {
              text: getErrorMessage(
                subTopicsQuery.error,
                "Unable to load sub-topics.",
              ),
              type: "error",
            }
          : submitAttempted && errors.subTopicId
            ? { text: errors.subTopicId, type: "error" }
            : undefined;

  const handleSubmit = async () => {
    setSubmitAttempted(true);

    const validationErrors = validateState(state);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = {
      name: state.testName.trim(),
      type: TEST_TYPE,
      subject: state.subjectId,
      topics: [state.topicId],
      sub_topics: [state.subTopicId],
      correct_marks: toNumber(state.marking.correctAnswer) ?? 0,
      wrong_marks: toNumber(state.marking.wrongAnswer) ?? 0,
      unattempt_marks: toNumber(state.marking.unattempted) ?? 0,
      difficulty: normalizeDifficultyForPayload(state.difficulty),
      total_time: toNumber(state.duration) ?? 0,
      total_marks: toNumber(state.marking.totalMarks) ?? 0,
      total_questions: toNumber(state.marking.noOfQuestions) ?? 0,
      status: "draft",
    };
    const isEditing = Boolean(testId);
    const requestUrl = isEditing ? `/api/tests/${testId}` : "/api/tests";
    const requestMethod = isEditing ? "PUT" : "POST";

    let loadingToastId: string | undefined;

    try {
      setIsSaving(true);
      loadingToastId = toast.loading(isEditing ? "Updating test..." : "Creating test...");
      console.log("SAVE TEST PAYLOAD", {
        isEditing,
        requestUrl,
        requestMethod,
        testId,
        payload,
      });
      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success?: boolean;
        data?: { id?: string };
        message?: string;
        errors?: unknown;
      };

      console.log("SAVE TEST RESPONSE", {
        isEditing,
        requestUrl,
        requestMethod,
        status: response.status,
        ok: response.ok,
        result,
      });

      if (!response.ok || !result.success) {
        const validationMessage = formatBackendErrors(result.errors);
        throw new Error(
          validationMessage || result.message || "Unable to save test.",
        );
      }

      toast.dismiss(loadingToastId);
      toast.success(isEditing ? "Test updated, moving to question editor" : "Test created, moving to question editor");
      await new Promise((resolve) => setTimeout(resolve, 600));

      const params = new URLSearchParams({
        testId: result.data?.id ?? testId,
        subjectId: state.subjectId,
        topicId: state.topicId,
        subTopicId: state.subTopicId,
        questions: String(payload.total_questions),
        testName: state.testName.trim(),
        totalTime: String(payload.total_time),
        totalMarks: String(payload.total_marks),
        totalQuestions: String(payload.total_questions),
        duration: state.duration,
        correctMarks: state.marking.correctAnswer,
        wrongMarks: state.marking.wrongAnswer,
        unattemptMarks: state.marking.unattempted,
        subjectName: getOptionName(subjectsQuery.data, state.subjectId),
        topicName: getOptionName(topicsQuery.data, state.topicId),
        subTopicName: getOptionName(subTopicsQuery.data, state.subTopicId),
        difficulty: state.difficulty,
      });

      router.push(`/test-creation/question-creation?${params.toString()}`);
    } catch (error) {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      toast.error(getErrorMessage(error, "Unable to save test."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          label="Subject"
          message={subjectMessage?.text}
          messageType={subjectMessage?.type}
        >
          <FormSelect
            placeholder="Choose from Drop-down"
            options={subjectsQuery.data ?? []}
            value={state.subjectId}
            onChange={(value) =>
              setState((current) => ({
                ...current,
                subjectId: value,
                topicId: "",
                subTopicId: "",
              }))
            }
            isLoading={subjectsQuery.isLoading}
            disabled={subjectsQuery.isError}
            hasError={subjectMessage?.type === "error"}
          />
        </FormField>

        <FormField
          label="Name of Test"
          message={submitAttempted && errors.testName ? errors.testName : ""}
          messageType="error"
        >
          <FormInput
            placeholder="Enter name of Test"
            value={state.testName}
            onChange={(value) => setState((current) => ({ ...current, testName: value }))}
            hasError={Boolean(submitAttempted && errors.testName)}
          />
        </FormField>

        <FormField
          label="Topic"
          message={topicMessage?.text}
          messageType={topicMessage?.type}
        >
          <FormSelect
            placeholder="Choose from Drop-down"
            options={topicsQuery.data ?? []}
            value={state.topicId}
            onChange={(value) =>
              setState((current) => ({
                ...current,
                topicId: value,
                subTopicId: "",
              }))
            }
            isLoading={topicsQuery.isLoading}
            disabled={!state.subjectId || topicsQuery.isError}
            hasError={topicMessage?.type === "error"}
          />
        </FormField>

        <FormField
          label="Sub Topic"
          message={subTopicMessage?.text}
          messageType={subTopicMessage?.type}
        >
          <FormSelect
            placeholder="Choose from Drop-down"
            options={subTopicsQuery.data ?? []}
            value={state.subTopicId}
            onChange={(value) =>
              setState((current) => ({ ...current, subTopicId: value }))
            }
            isLoading={subTopicsQuery.isLoading}
            disabled={!state.topicId || subTopicsQuery.isError}
            hasError={subTopicMessage?.type === "error"}
          />
        </FormField>

        <FormField
          label="Duration (Minutes)"
          message={submitAttempted && errors.duration ? errors.duration : ""}
          messageType="error"
        >
          <FormInput
            placeholder="Enter the time"
            value={state.duration}
            onChange={(value) => setState((current) => ({ ...current, duration: value }))}
            type="number"
            inputMode="numeric"
            min={1}
            step="1"
            hasError={Boolean(submitAttempted && errors.duration)}
          />
        </FormField>

        <DifficultySelector
          value={state.difficulty}
          onChange={(value) => setState((current) => ({ ...current, difficulty: value }))}
        />
      </div>

      <div className="mt-6">
        <MarkingScheme
          value={state.marking}
          onChange={(marking) =>
            setState((current) => ({
              ...current,
              marking,
            }))
          }
          showErrors={submitAttempted}
        />
        {submitAttempted && errors.marking ? (
          <p className="mt-2 text-xs text-rose-600">{errors.marking}</p>
        ) : null}
      </div>

      <div className="mt-8 flex items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-2xl bg-slate-50 px-6 py-3 text-sm font-semibold text-[#3558E8] transition hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="rounded-2xl bg-[#7186F6] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(113,134,246,0.26)] transition hover:bg-[#6579eb] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Next"}
        </button>
      </div>
    </section>
  );
}
