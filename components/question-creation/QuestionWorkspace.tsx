"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock3, Download, Pencil, Plus, ScrollText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import FormSelect from "@/components/test-creation/chapter-wise/FormSelect";
import {
  fetchSubTopics,
  fetchTopics,
  type SelectOption,
} from "@/components/test-creation/chapter-wise/api";
import QuestionOptions from "./QuestionOptions";
import QuestionRichTextEditor from "./QuestionRichTextEditor";
import {
  createEmptyQuestionDraft,
  normalizeDifficultyValue,
  type QuestionDraft,
} from "./questionTypes";

type QuestionWorkspaceProps = {
  subjectId: string;
  topicId: string;
  subTopicId: string;
  testName: string;
  subjectName: string;
  topicName: string;
  subTopicName: string;
  draft: QuestionDraft;
  onDraftChange: (draft: QuestionDraft) => void;
  onSaveQuestion: (draft: QuestionDraft) => Promise<void>;
  onOpenImport: () => void;
  isSaving?: boolean;
  totalTime: number;
  totalMarks: number;
  questionNumber: number;
  totalQuestions: number;
};

const difficultyOptions: SelectOption[] = [
  { id: "easy", name: "Easy" },
  { id: "medium", name: "Medium" },
  { id: "hard", name: "Difficult" },
];

export default function QuestionWorkspace({
  subjectId,
  topicId,
  subTopicId,
  testName,
  subjectName,
  topicName,
  subTopicName,
  draft,
  onDraftChange,
  onSaveQuestion,
  onOpenImport,
  isSaving = false,
  totalTime,
  totalMarks,
  questionNumber,
  totalQuestions,
}: QuestionWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questionContent, setQuestionContent] = useState(draft.question);
  const [selectedDifficulty, setSelectedDifficulty] = useState(
    normalizeDifficultyValue(draft.difficulty || "easy"),
  );
  const [selectedTopicId, setSelectedTopicId] = useState(draft.topicId || topicId);
  const [selectedSubTopicId, setSelectedSubTopicId] = useState(draft.subTopicId || subTopicId);
  const [solutionContent, setSolutionContent] = useState(draft.solution);
  const [options, setOptions] = useState(draft.options.length ? draft.options : createEmptyQuestionDraft().options);
  const [correctOptionId, setCorrectOptionId] = useState(draft.correctOptionId);

  const topicsQuery = useQuery({
    queryKey: ["question-topics", subjectId],
    queryFn: () => fetchTopics(subjectId),
    enabled: Boolean(subjectId),
  });

  const subTopicsQuery = useQuery({
    queryKey: ["question-sub-topics", selectedTopicId],
    queryFn: () => fetchSubTopics(selectedTopicId),
    enabled: Boolean(selectedTopicId),
  });

  const info = useMemo(
    () => [
      { label: "Subject", value: subjectName || "English" },
      { label: "Topic", value: topicName || "Grammar" },
      { label: "Sub Topic", value: subTopicName || "Application" },
    ],
    [subjectName, topicName, subTopicName],
  );

  const handleEditTest = () => {
    const testId = searchParams.get("testId");
    if (!testId) {
      return;
    }

    router.push(`/test-creation/create-test/chapter-wise?testId=${testId}`);
  };

  const commitDraft = (nextDraft: QuestionDraft) => {
    onDraftChange(nextDraft);
  };

  const handleOptionChange = (next: {
    options: QuestionDraft["options"];
    correctOptionId: QuestionDraft["correctOptionId"];
  }) => {
    setOptions(next.options);
    setCorrectOptionId(next.correctOptionId);
    commitDraft({
      question: questionContent,
      options: next.options,
      correctOptionId: next.correctOptionId,
      solution: solutionContent,
      difficulty: selectedDifficulty,
      subjectId,
      topicId: selectedTopicId,
      subTopicId: selectedSubTopicId,
    });
  };

  const handleSave = async () => {
    await onSaveQuestion({
      question: questionContent,
      options,
      correctOptionId,
      solution: solutionContent,
      difficulty: selectedDifficulty,
      subjectId,
      topicId: selectedTopicId,
      subTopicId: selectedSubTopicId,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-[#17154A] px-3 py-1 text-xs font-medium text-white">
              Chapter Wise
            </span>

            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {testName || "Untitled Test"}
              </h2>
              <span className="inline-flex rounded-full bg-[#36c3ad] px-3 py-1 text-xs font-medium text-white">
                {selectedDifficulty === "hard"
                  ? "Difficult"
                  : selectedDifficulty || "Easy"}
              </span>
            </div>

            <p className="text-sm text-slate-500">Build questions for this test</p>

            <div className="space-y-3 pt-1">
              {info.map((item) => (
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
          {/* <Badge>{difficulty || "Easy"}</Badge> */}

          <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-2 py-1">
            <div className="flex items-center gap-2 px-3 py-1.5 text-slate-500">
              <Clock3 className="h-4 w-4" />
              <span className="text-sm">{totalTime} Min</span>
            </div>
            <span className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2 px-3 py-1.5 text-slate-500">
              <ScrollText className="h-4 w-4" />
              <span className="text-sm">{totalQuestions} Qs</span>
            </div>
            <span className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2 px-3 py-1.5 text-slate-500">
              <Plus className="h-4 w-4" />
              <span className="text-sm">{totalMarks} Marks</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Question {questionNumber}/{totalQuestions}
        </h2>
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50">
            <Plus className="mr-1 inline-block h-3.5 w-3.5" />
            MCQ
          </button>
          <button
            type="button"
            onClick={onOpenImport}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50"
          >
            <Download className="mr-1 inline-block h-3.5 w-3.5" />
            CSV
          </button>
        </div>
      </div>

      <button className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-500">
        Delete All Edits
      </button>

      <QuestionRichTextEditor
        value={questionContent}
        onChange={(value) => {
          setQuestionContent(value);
          commitDraft({
            question: value,
            options,
            correctOptionId,
            solution: solutionContent,
            difficulty: selectedDifficulty,
            subjectId,
            topicId: selectedTopicId,
            subTopicId: selectedSubTopicId,
          });
        }}
      />

      <QuestionOptions
        value={options}
        correctOptionId={correctOptionId}
        onChange={handleOptionChange}
      />

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-900">Add Solution</p>
        <textarea
          value={solutionContent}
          onChange={(event) => {
            const nextValue = event.target.value;
            setSolutionContent(nextValue);
            commitDraft({
              question: questionContent,
              options,
              correctOptionId,
              solution: nextValue,
              difficulty: selectedDifficulty,
              subjectId,
              topicId: selectedTopicId,
              subTopicId: selectedSubTopicId,
            });
          }}
          placeholder="Type here"
          className="min-h-[120px] w-full rounded-[18px] border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#5988EF] focus:ring-4 focus:ring-[#5988EF]/10"
        />
      </div>

      <div className="grid gap-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-xs font-medium text-slate-600">Level of Difficulty</span>
          <FormSelect
            placeholder="Select from Drop-down"
            options={difficultyOptions}
            value={selectedDifficulty}
            onChange={(value) => {
              setSelectedDifficulty(value);
              commitDraft({
                question: questionContent,
                options,
                correctOptionId,
                solution: solutionContent,
                difficulty: value,
                subjectId,
                topicId: selectedTopicId,
                subTopicId: selectedSubTopicId,
              });
            }}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium text-slate-600">Topic</span>
          <FormSelect
            placeholder="Select from Drop-down"
            options={topicsQuery.data ?? []}
            value={selectedTopicId}
            onChange={(value) => {
              setSelectedTopicId(value);
              setSelectedSubTopicId("");
              commitDraft({
                question: questionContent,
                options,
                correctOptionId,
                solution: solutionContent,
                difficulty: selectedDifficulty,
                subjectId,
                topicId: value,
                subTopicId: "",
              });
            }}
            isLoading={topicsQuery.isLoading}
            disabled={!subjectId || topicsQuery.isError}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium text-slate-600">Sub-topic</span>
          <FormSelect
            placeholder="Select from Drop-down"
            options={subTopicsQuery.data ?? []}
            value={selectedSubTopicId}
            onChange={(value) => {
              setSelectedSubTopicId(value);
              commitDraft({
                question: questionContent,
                options,
                correctOptionId,
                solution: solutionContent,
                difficulty: selectedDifficulty,
                subjectId,
                topicId: selectedTopicId,
                subTopicId: value,
              });
            }}
            isLoading={subTopicsQuery.isLoading}
            disabled={!selectedTopicId || subTopicsQuery.isError}
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button className="rounded-xl bg-[#FF8B8B] px-4 py-3 text-sm font-semibold text-white">
          Exit Test Creation
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-[#6E83F6] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Save Question"}
        </button>
      </div>
    </div>
  );
}
