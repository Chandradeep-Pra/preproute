import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
  message?: string;
  messageType?: "error" | "loading";
};

export default function FormField({
  label,
  children,
  className = "",
  message,
  messageType,
}: FormFieldProps) {
  return (
    <label className={`block space-y-2 ${className}`.trim()}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {message ? (
        <p
          className={`text-xs ${
            messageType === "error" ? "text-rose-600" : "text-slate-500"
          }`}
        >
          {messageType === "loading" ? (
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
              </span>
              <span>{message}</span>
            </span>
          ) : (
            message
          )}
        </p>
      ) : null}
    </label>
  );
}
