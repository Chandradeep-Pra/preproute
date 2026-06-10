"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { SelectOption } from "./api";

type FormSelectProps = {
  placeholder: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
};

export default function FormSelect({
  placeholder,
  options,
  value = "",
  onChange,
  disabled = false,
  isLoading = false,
  hasError = false,
}: FormSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value),
    [options, value],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const buttonLabel = selectedOption?.name ?? placeholder;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 text-left text-sm transition outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
          hasError
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10"
            : "border-slate-200 hover:border-slate-300 focus:border-[#5988EF] focus:ring-[#5988EF]/10"
        }`}
      >
        <span
          className={`truncate ${
            selectedOption ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {isLoading ? "Loading..." : buttonLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !isLoading && !disabled ? (
        <div className="absolute z-20 mt-2 w-full rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
          <div className="max-h-[300px] overflow-y-auto rounded-[16px] pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
            <button
              type="button"
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${
                !value ? "bg-slate-50 text-slate-900" : "text-slate-500"
              }`}
            >
              <span>{placeholder}</span>
            </button>
            {options.map((option) => {
              const isActive = option.id === value;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange?.(option.id);
                    setOpen(false);
                  }}
                  className={`mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition hover:bg-[#EEF4FF] ${
                    isActive
                      ? "bg-[#EEF4FF] text-[#3558E8]"
                      : "text-slate-700"
                  }`}
                >
                  <span className="truncate">{option.name}</span>
                  {isActive ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
