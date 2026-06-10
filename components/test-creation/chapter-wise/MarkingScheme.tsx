"use client";

import FormField from "./FormField";
import FormInput from "./FormInput";

export type MarkingSchemeState = {
  wrongAnswer: string;
  unattempted: string;
  correctAnswer: string;
  noOfQuestions: string;
  totalMarks: string;
};

type MarkingSchemeProps = {
  value: MarkingSchemeState;
  onChange: (value: MarkingSchemeState) => void;
  showErrors?: boolean;
};

function normalizeWrongAnswer(value: string) {
  const cleaned = value.trim();

  if (!cleaned) {
    return "";
  }

  const parsed = Number(cleaned);

  if (Number.isNaN(parsed)) {
    return cleaned;
  }

  return parsed === 0 ? "0" : `-${Math.abs(parsed)}`;
}

function requiredMessage(value: string, label: string, showErrors: boolean) {
  return showErrors && !value.trim() ? `${label} is required.` : "";
}

export default function MarkingScheme({
  value,
  onChange,
  showErrors = false,
}: MarkingSchemeProps) {
  const update = (patch: Partial<MarkingSchemeState>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-700">Marking Scheme:</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <FormField
          label="Wrong Answer"
          message={requiredMessage(value.wrongAnswer, "Wrong Answer", showErrors)}
          messageType="error"
        >
          <div className="max-w-[120px]">
            <FormInput
              placeholder="-1"
              type="number"
              value={value.wrongAnswer}
              onChange={(nextValue) =>
                update({ wrongAnswer: normalizeWrongAnswer(nextValue) })
              }
              hasError={Boolean(
                requiredMessage(value.wrongAnswer, "Wrong Answer", showErrors),
              )}
            />
          </div>
        </FormField>
        <FormField
          label="Unattempted"
          message={requiredMessage(value.unattempted, "Unattempted", showErrors)}
          messageType="error"
        >
          <div className="max-w-[120px]">
            <FormInput
              placeholder="+0"
              value={value.unattempted}
              onChange={(nextValue) => update({ unattempted: nextValue })}
              hasError={Boolean(
                requiredMessage(value.unattempted, "Unattempted", showErrors),
              )}
            />
          </div>
        </FormField>
        <FormField
          label="Correct Answer"
          message={requiredMessage(value.correctAnswer, "Correct Answer", showErrors)}
          messageType="error"
        >
          <div className="max-w-[120px]">
            <FormInput
              placeholder="+5"
              value={value.correctAnswer}
              onChange={(nextValue) => update({ correctAnswer: nextValue })}
              hasError={Boolean(
                requiredMessage(
                  value.correctAnswer,
                  "Correct Answer",
                  showErrors,
                ),
              )}
            />
          </div>
        </FormField>
        <FormField
          label="No of Questions"
          message={requiredMessage(value.noOfQuestions, "No of Questions", showErrors)}
          messageType="error"
        >
          <FormInput
            placeholder="Ex:250 Marks"
            value={value.noOfQuestions}
            onChange={(nextValue) => update({ noOfQuestions: nextValue })}
            hasError={Boolean(
              requiredMessage(value.noOfQuestions, "No of Questions", showErrors),
            )}
          />
        </FormField>
        <FormField
          label="Total Marks"
          message={requiredMessage(value.totalMarks, "Total Marks", showErrors)}
          messageType="error"
        >
          <FormInput
            placeholder="Ex:250 Marks"
            value={value.totalMarks}
            onChange={(nextValue) => update({ totalMarks: nextValue })}
            hasError={Boolean(
              requiredMessage(value.totalMarks, "Total Marks", showErrors),
            )}
          />
        </FormField>
      </div>
    </div>
  );
}
