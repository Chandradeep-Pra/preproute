const options = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "difficult", label: "Difficult" },
];

type DifficultySelectorProps = {
  value?: string;
  onChange?: (value: string) => void;
};

export default function DifficultySelector({
  value = "easy",
  onChange,
}: DifficultySelectorProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-slate-700">
        Test Difficulty Level
      </legend>
      <div className="flex flex-wrap gap-x-12 gap-y-3">
        {options.map((option) => (
          <label
            key={option.id}
            className="flex items-center gap-2 text-sm text-slate-700"
          >
            <input
              type="radio"
              name="difficulty"
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange?.(option.id)}
              className="h-4 w-4 accent-[#5988EF]"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
