type FormInputProps = {
  placeholder: string;
  type?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  min?: number;
  step?: string;
  inputMode?: "text" | "numeric" | "decimal";
  hasError?: boolean;
};

export default function FormInput({
  placeholder,
  type = "text",
  value,
  onChange,
  min,
  step,
  inputMode,
  hasError = false,
}: FormInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      min={min}
      step={step}
      inputMode={inputMode}
      aria-invalid={hasError}
      className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:ring-4 ${
        hasError
          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10"
          : "border-slate-200 focus:border-[#5988EF] focus:ring-[#5988EF]/10"
      }`}
    />
  );
}
