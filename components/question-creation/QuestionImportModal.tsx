"use client";

import { useMemo, useState } from "react";
import { Download, Upload, X } from "lucide-react";
import { parseQuestionWorkbook, type ImportedQuestionRow } from "./questionImport";

type QuestionImportModalProps = {
  open: boolean;
  onClose: () => void;
  templateHref: string;
  currentTotalQuestions: number;
  currentTotalMarks: number;
  existingQuestionNumbers: number[];
  onIncreaseTotals: (
    nextTotalQuestions: number,
    nextTotalMarks: number,
  ) => Promise<void>;
  onImportRows: (rows: ImportedQuestionRow[]) => Promise<void>;
};

type Resolution = "keep_current" | "use_new";

export default function QuestionImportModal({
  open,
  onClose,
  templateHref,
  currentTotalQuestions,
  currentTotalMarks,
  existingQuestionNumbers,
  onIncreaseTotals,
  onImportRows,
}: QuestionImportModalProps) {
  const [rows, setRows] = useState<ImportedQuestionRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [newTotalQuestions, setNewTotalQuestions] = useState(String(currentTotalQuestions));
  const [newTotalMarks, setNewTotalMarks] = useState(String(currentTotalMarks));
  const [resolutionByQuestionNo, setResolutionByQuestionNo] = useState<
    Record<number, Resolution>
  >({});

  const maxQuestionNo = useMemo(
    () => rows.reduce((max, row) => Math.max(max, row.questionNo), 0),
    [rows],
  );

  const duplicateQuestionNos = useMemo(
    () => rows
      .filter((row) => existingQuestionNumbers.includes(row.questionNo))
      .map((row) => row.questionNo),
    [existingQuestionNumbers, rows],
  );

  const needsIncrease = maxQuestionNo > currentTotalQuestions;

  const handleFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    setError("");
    setIsParsing(true);

    try {
      const parsed = await parseQuestionWorkbook(file);
      setRows(parsed);
      setResolutionByQuestionNo(
        Object.fromEntries(
          parsed.map((row) => [
            row.questionNo,
            existingQuestionNumbers.includes(row.questionNo)
              ? "keep_current"
              : "use_new",
          ]),
        ) as Record<number, Resolution>,
      );
      const highestQuestionNo = parsed.reduce((max, row) => Math.max(max, row.questionNo), 0);
      setNewTotalQuestions(String(Math.max(currentTotalQuestions, highestQuestionNo)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read file.");
      setRows([]);
      setResolutionByQuestionNo({});
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    const selectedRows = rows.filter((row) => {
      const resolution =
        resolutionByQuestionNo[row.questionNo] ??
        (existingQuestionNumbers.includes(row.questionNo) ? "keep_current" : "use_new");

      return resolution === "use_new";
    });

    if (selectedRows.length === 0) {
      setError("There are no rows selected to import.");
      return;
    }

    setError("");
    setIsImporting(true);
    try {
      await onImportRows(selectedRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import questions.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleIncreaseTotals = async () => {
    const nextQuestions = Number(newTotalQuestions);
    const nextMarks = Number(newTotalMarks);

    if (!Number.isFinite(nextQuestions) || nextQuestions <= 0) {
      setError("Please enter a valid total questions value.");
      return;
    }

    if (!Number.isFinite(nextMarks) || nextMarks <= 0) {
      setError("Please enter a valid total marks value.");
      return;
    }

    setError("");
    setIsUpdating(true);
    try {
      await onIncreaseTotals(nextQuestions, nextMarks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update test size.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-4xl  rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] overflow-scroll">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Import Questions</h3>
            <p className="text-sm text-slate-500">
              Download the template, fill it, and upload the xlsx file.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 overflow-y-auto p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <a
              href={templateHref}
              download
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6E83F6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5f74e6]"
            >
              <Download className="h-4 w-4" />
              Download question_book.xlsx
            </a>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-slate-300 bg-white px-4 py-8 text-center transition hover:border-[#6E83F6] hover:bg-[#F5F7FF]">
              <Upload className="h-6 w-6 text-[#6E83F6]" />
              <span className="mt-3 text-sm font-semibold text-slate-900">
                Upload your file
              </span>
              <span className="mt-1 text-xs text-slate-500">XLSX or CSV</span>
              <input
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <div className="space-y-2 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Upload summary</p>
              <p className="text-xs text-amber-800">
                Total questions: <span className="font-semibold">{rows.length || 0}</span>
              </p>
              <p className="text-xs text-amber-800">
                Highest question no: <span className="font-semibold">{maxQuestionNo || 0}</span>
              </p>
              {needsIncrease ? (
                <p className="text-xs font-medium text-amber-900">
                  Question number exceeds current total. Increase the test size first.
                </p>
              ) : null}
            </div>

            {needsIncrease ? (
              <div className="space-y-3 rounded-[20px] border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Increase test size</p>
                <label className="block space-y-1">
                  <span className="text-xs text-slate-500">Total questions</span>
                  <input
                    type="number"
                    min={currentTotalQuestions}
                    value={newTotalQuestions}
                    onChange={(event) => setNewTotalQuestions(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#6E83F6]"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-slate-500">Total marks</span>
                  <input
                    type="number"
                    min={currentTotalMarks}
                    value={newTotalMarks}
                    onChange={(event) => setNewTotalMarks(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#6E83F6]"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleIncreaseTotals}
                  disabled={isUpdating}
                  className="w-full rounded-xl bg-[#17154A] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUpdating ? "Updating..." : "Increase test size"}
                </button>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Parsed questions</p>
                <p className="text-xs text-slate-500">
                  {rows.length} question{rows.length === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="mt-4 max-h-[calc(90vh-320px)] space-y-3 overflow-y-auto pr-1">
                {isParsing ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Parsing file...
                  </div>
                ) : rows.length > 0 ? (
                  rows.map((row) => {
                    const isConflict = existingQuestionNumbers.includes(row.questionNo);
                    const resolution =
                      resolutionByQuestionNo[row.questionNo] ??
                      (isConflict ? "keep_current" : "use_new");

                    return (
                      <div
                        key={row.questionNo}
                        className={`rounded-2xl border p-4 ${
                          isConflict
                            ? "border-amber-200 bg-amber-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">
                              Question {row.questionNo}
                            </p>
                            <p className="line-clamp-2 text-sm text-slate-600">
                              {row.question}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isConflict
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isConflict ? "Already exists" : "New"}
                          </span>
                        </div>

                        {isConflict ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setResolutionByQuestionNo((current) => ({
                                  ...current,
                                  [row.questionNo]: "keep_current",
                                }))
                              }
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                resolution === "keep_current"
                                  ? "bg-slate-900 text-white"
                                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              Keep current
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setResolutionByQuestionNo((current) => ({
                                  ...current,
                                  [row.questionNo]: "use_new",
                                }))
                              }
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                resolution === "use_new"
                                  ? "bg-[#6E83F6] text-white"
                                  : "border border-[#C9D4FF] bg-white text-[#6E83F6] hover:bg-[#F5F7FF]"
                              }`}
                            >
                              Use new
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    Upload a file to preview the parsed questions here.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || rows.length === 0 || needsIncrease}
                className="rounded-xl bg-[#36c3ad] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isImporting ? "Importing..." : "Import questions"}
              </button>
            </div>
            {duplicateQuestionNos.length > 0 ? (
              <p className="text-xs text-amber-700">
                Conflicts found for question no.{" "}
                {Array.from(new Set(duplicateQuestionNos)).join(", ")}.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
