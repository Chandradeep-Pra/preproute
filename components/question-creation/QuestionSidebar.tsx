"use client";

import { ChevronsRight } from "lucide-react";

type QuestionSidebarProps = {
  totalQuestions: number;
  activeQuestion: number;
  completedQuestions: number[];
  onSelectQuestion: (questionNumber: number) => void;
};

export default function QuestionSidebar({
  totalQuestions,
  activeQuestion,
  completedQuestions,
  onSelectQuestion,
}: QuestionSidebarProps) {
  const questionNumbers = Array.from(
    { length: Math.max(totalQuestions, 1) },
    (_, index) => index + 1,
  );

  return (
    <aside className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">Question creation</p>
      <p className="mt-2 text-xs text-slate-500">
        Total Questions : {totalQuestions}
      </p>

      <div className="mt-4 max-h-[calc(100vh-260px)] space-y-2 overflow-y-auto pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
        {questionNumbers.map((questionNumber) => {
          const isActive = questionNumber === activeQuestion;
          const isCompleted = completedQuestions.includes(questionNumber);

          return (
            <button
              key={questionNumber}
              type="button"
              onClick={() => onSelectQuestion(questionNumber)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
                isActive
                  ? "border-[#5B7CF0] bg-[#EEF3FF] text-[#3558E8]"
                  : isCompleted
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>Question {questionNumber}</span>
              <ChevronsRight className={isCompleted && !isActive ? "text-emerald-600" : ""} />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
