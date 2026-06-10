"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { TestItem } from "@/lib/tests";

const PAGE_SIZE = 10;

function statusStyles(status: string) {
  const normalized = status?.toLowerCase();

  if (normalized === "draft") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (normalized === "published") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
}

export function TestTable({ tests }: { tests: TestItem[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(tests.length / PAGE_SIZE));
  const activePage = Math.min(page, totalPages);

  const visibleTests = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return tests.slice(start, start + PAGE_SIZE);
  }, [activePage, tests]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Topics</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleTests.map((test) => (
                <tr
                  key={test.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    router.push(`/test-creation/create-test/chapter-wise?testId=${test.id}`)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(
                        `/test-creation/create-test/chapter-wise?testId=${test.id}`,
                      );
                    }
                  }}
                  className="cursor-pointer align-top transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{test.name}</p>
                    <p className="mt-1 text-sm text-slate-500">ID: {test.id}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {test.subject}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {test.topics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles(
                        test.status,
                      )}`}
                    >
                      {test.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatDate(test.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          Page {activePage} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={activePage === 1}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={activePage === totalPages}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
