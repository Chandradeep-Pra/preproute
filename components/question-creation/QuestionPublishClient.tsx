"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Clock3, Pencil, ScrollText, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import QuestionSidebar from "./QuestionSidebar";
import PreviewQuestionCard from "./PreviewQuestionCard";
import type { TestDetailResponse } from "@/lib/tests";

type PreviewQuestion = {
  id: string;
  question?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  correct_option?: string;
  explanation?: string;
  difficulty?: string;
};

function readNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function loadPreviewData(testId: string) {
  const testResponse = await fetch(`/api/tests/${testId}`, { cache: "no-store" });
  const testPayload = (await testResponse.json()) as TestDetailResponse & {
    success?: boolean;
    message?: string;
  };

  if (!testResponse.ok || !testPayload.success) {
    throw new Error(testPayload.message ?? "Unable to load test.");
  }

  const questionIds = testPayload.data.questions ?? [];

  if (!questionIds.length) {
    return { test: testPayload.data, questions: [] };
  }

  const questionResponse = await fetch("/api/questions/fetchBulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_ids: questionIds }),
  });

  const questionPayload = (await questionResponse.json()) as {
    success?: boolean;
    message?: string;
    data?: PreviewQuestion[];
    errors?: unknown;
  };

  if (!questionResponse.ok || !questionPayload.success) {
    throw new Error(questionPayload.message ?? "Unable to load questions.");
  }

  return {
    test: testPayload.data,
    questions: questionPayload.data ?? [],
  };
}

export default function QuestionPublishClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId") ?? "";
  const testName = searchParams.get("testName") ?? searchParams.get("name") ?? "";
  const subjectName = searchParams.get("subjectName") ?? "Subject";
  const topicName = searchParams.get("topicName") ?? "Topic";
  const subTopicName = searchParams.get("subTopicName") ?? "Sub Topic";
  const totalQuestions = readNumber(searchParams.get("totalQuestions"), 1);
  const totalMarks = readNumber(searchParams.get("totalMarks"), 250);
  const totalTime = readNumber(searchParams.get("totalTime"), 60);
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [liveUntil, setLiveUntil] = useState("custom");

  const previewQuery = useQuery({
    queryKey: ["test-preview", testId],
    queryFn: () => loadPreviewData(testId),
    enabled: Boolean(testId),
  });

  const questionNumbers = useMemo(
    () =>
      Array.from(
        { length: Math.max(previewQuery.data?.questions.length ?? totalQuestions, 1) },
        (_, index) => index + 1,
      ),
    [previewQuery.data?.questions.length, totalQuestions],
  );

  const questionCount = previewQuery.data?.questions.length ?? 0;
  const canPublish = Boolean(testId) && questionCount > 0;
  const title = previewQuery.data?.test.name ?? testName ?? "Untitled Test";

  const handleEditTest = () => {
    if (!testId) {
      return;
    }

    router.push(`/test-creation/create-test/chapter-wise?testId=${testId}`);
  };

  const handleEditQuestions = () => {
    if (!testId) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    router.push(`/test-creation/question-creation?${params.toString()}`);
  };

  const handlePublish = async () => {
    if (!canPublish) {
      toast.error("Please add at least one question before publishing.");
      return;
    }

    const loadingToastId = toast.loading(
      mode === "schedule" ? "Scheduling test..." : "Publishing test...",
    );

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: mode === "schedule" ? "scheduled" : "live",
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        errors?: unknown;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to publish test.");
      }

      toast.success(
        mode === "schedule"
          ? "Test scheduled successfully"
          : "Test published successfully",
      );
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to publish test.");
    } finally {
      toast.dismiss(loadingToastId);
    }
  };

  if (previewQuery.isLoading) {
    return (
      <section className="px-5 py-6 md:px-8 md:py-8">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading preview...
        </div>
      </section>
    );
  }

  if (previewQuery.isError) {
    return (
      <section className="px-5 py-6 md:px-8 md:py-8">
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          {previewQuery.error instanceof Error
            ? previewQuery.error.message
            : "Unable to load preview."}
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 py-6 md:px-8 md:py-8">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <QuestionSidebar
          totalQuestions={Math.max(questionNumbers.length, 1)}
          activeQuestion={0}
          completedQuestions={questionNumbers}
          onSelectQuestion={() => undefined}
        />

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Test created
              </span>
              <span className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-600">
                <ShieldCheck className="mr-1 inline-block h-3.5 w-3.5" />
                All {questionCount} Questions done
              </span>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full bg-[#17154A] px-3 py-1 text-xs font-medium text-white">
                    Chapter Wise
                  </span>

                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    <span className="inline-flex rounded-full bg-[#36c3ad] px-3 py-1 text-xs font-medium text-white">
                      {searchParams.get("difficulty") === "hard"
                        ? "Difficult"
                        : searchParams.get("difficulty") || "Easy"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500">Build questions for this test</p>

                  <div className="space-y-3 pt-1">
                    {[
                      { label: "Subject", value: subjectName },
                      { label: "Topic", value: topicName },
                      { label: "Sub Topic", value: subTopicName },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="grid grid-cols-[92px_auto] items-center gap-3 text-sm"
                      >
                        <span className="text-slate-500">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">:</span>
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-600">
                            {item.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEditTest}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D7E0FF] text-[#6E83F6] transition hover:bg-[#F5F7FF]"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-2 py-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-slate-500">
                    <Clock3 className="h-4 w-4" />
                    <span className="text-sm">{totalTime} Min</span>
                  </div>
                  <span className="h-6 w-px bg-slate-200" />
                  <div className="flex items-center gap-2 px-3 py-1.5 text-slate-500">
                    <ScrollText className="h-4 w-4" />
                    <span className="text-sm">{questionCount || totalQuestions} Qs</span>
                  </div>
                  <span className="h-6 w-px bg-slate-200" />
                  <div className="flex items-center gap-2 px-3 py-1.5 text-slate-500">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm">{totalMarks} Marks</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEditQuestions}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Edit Questions
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setMode("now")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "now"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                Publish Now
              </button>
              <button
                type="button"
                onClick={() => setMode("schedule")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "schedule"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                Schedule Publish
              </button>
            </div>

            {mode === "schedule" ? (
              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Select Date and Time
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose when this test should go live.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-medium text-slate-600">Date</span>
                    <input
                      type="date"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5988EF] focus:ring-4 focus:ring-[#5988EF]/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-medium text-slate-600">Time</span>
                    <input
                      type="time"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5988EF] focus:ring-4 focus:ring-[#5988EF]/10"
                    />
                  </label>
                </div>
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Live Until</p>
                <p className="mt-1 text-sm text-slate-500">
                  Choose how long this test should remain available on the platform.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  "Always Available",
                  "1 Week",
                  "2 Weeks",
                  "3 Weeks",
                  "1 Month",
                  "Custom Duration",
                ].map((option) => {
                  const value = option.toLowerCase().replace(/\s+/g, "-");
                  const isChecked = liveUntil === value;

                  return (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-3 text-sm text-slate-700"
                    >
                      <input
                        type="radio"
                        name="liveUntil"
                        value={value}
                        checked={isChecked}
                        onChange={() => setLiveUntil(value)}
                        className="h-4 w-4 accent-[#6E83F6]"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>

              {liveUntil === "custom-duration" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="date"
                    placeholder="Select End Date"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5988EF] focus:ring-4 focus:ring-[#5988EF]/10"
                  />
                  <input
                    type="time"
                    placeholder="Select End Time"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5988EF] focus:ring-4 focus:ring-[#5988EF]/10"
                  />
                </div>
              ) : null}
            </div>

            {!canPublish ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Add at least one question before publishing the test.
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={!canPublish}
                className="rounded-xl bg-[#6E83F6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#5c74ea] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mode === "schedule" ? "Schedule Publish" : "Publish Test"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">All Questions</h3>
            {questionCount > 0 ? (
              previewQuery.data?.questions.map((question, index) => (
                <PreviewQuestionCard
                  key={question.id}
                  index={index + 1}
                  question={question}
                />
              ))
            ) : (
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                No questions have been added yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
