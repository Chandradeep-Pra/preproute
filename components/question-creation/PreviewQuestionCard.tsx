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

function labelFromOption(key: string) {
  return key.replace("option", "Option ");
}

function difficultyLabel(value?: string) {
  if (!value) {
    return "Easy";
  }

  return value === "hard" ? "Difficult" : value;
}

export default function PreviewQuestionCard({
  index,
  question,
}: {
  index: number;
  question: PreviewQuestion;
}) {
  const options = [
    { key: "option1", value: question.option1 },
    { key: "option2", value: question.option2 },
    { key: "option3", value: question.option3 },
    { key: "option4", value: question.option4 },
  ].filter((option) => option.value);

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5B7CF0]">
            Question {index}
          </p>
          <div
            className="prose prose-slate max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: question.question ?? "" }}
          />
        </div>

        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {difficultyLabel(question.difficulty)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const isCorrect = question.correct_option === option.key;

          return (
            <div
              key={option.key}
              className={`rounded-2xl border px-4 py-3 text-sm transition ${
                isCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <span className="mr-2 font-semibold text-slate-400">
                {labelFromOption(option.key)}:
              </span>
              {option.value}
            </div>
          );
        })}
      </div>

      {question.explanation ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Solution
          </p>
          <div
            className="prose prose-slate mt-2 max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: question.explanation }}
          />
        </div>
      ) : null}
    </article>
  );
}
