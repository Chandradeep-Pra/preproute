"use client";

import { Check, Trash2 } from "lucide-react";
import type {
  QuestionDraft,
  QuestionOptionDraft,
  QuestionOptionId,
} from "./questionTypes";

type QuestionOptionsProps = {
  value: QuestionDraft["options"];
  correctOptionId: QuestionOptionId | "";
  onChange: (next: {
    options: QuestionOptionDraft[];
    correctOptionId: QuestionOptionId | "";
  }) => void;
};

export default function QuestionOptions({
  value,
  correctOptionId,
  onChange,
}: QuestionOptionsProps) {
  const updateOption = (id: QuestionOptionId, text: string) => {
    onChange({
      options: value.map((option) =>
        option.id === id ? { ...option, text } : option,
      ),
      correctOptionId,
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-900">Type the options below</p>
      <div className="space-y-3">
        {value.map((option, index) => {
          const isCorrect = correctOptionId === option.id;

          return (
            <div
              key={option.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                onChange({
                  options: value,
                  correctOptionId: option.id,
                })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange({
                    options: value,
                    correctOptionId: option.id,
                  });
                }
              }}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                isCorrect
                  ? "border-[#6E83F6] bg-[#EEF3FF]"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  isCorrect ? "border-[#6E83F6] bg-[#6E83F6]" : "border-[#6B8AF5]"
                }`}
              >
                {isCorrect ? <Check className="h-2.5 w-2.5 text-white" /> : null}
              </span>

              <div className="flex flex-1 items-center gap-2">
                <span className="whitespace-nowrap text-xs font-medium text-slate-400">
                  Option {index + 1}
                </span>
                <input
                  value={option.text}
                  onChange={(event) => updateOption(option.id, event.target.value)}
                  onFocus={() =>
                    onChange({
                      options: value,
                      correctOptionId: option.id,
                    })
                  }
                  onKeyDown={(event) => event.stopPropagation()}
                  placeholder="Type Option here"
                  className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-300"
                />
              </div>

              <button
                type="button"
                aria-label={`Remove option ${index + 1}`}
                className="shrink-0 rounded-full p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
