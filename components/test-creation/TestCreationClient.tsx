"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { TestTable } from "@/components/test-creation/TestTable";
import type { TestsApiResponse } from "@/lib/tests";

async function loadTests() {
  const response = await fetch("/api/tests", { cache: "no-store" });
  const payload = (await response.json()) as TestsApiResponse;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "Unable to load tests.");
  }

  return payload.data;
}

function TestCreationView() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tests"],
    queryFn: loadTests,
  });

  return (
    <section className="px-5 py-2 md:px-8 ">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Tests
          </h1>
        </div>

        <Link
          href="/test-creation/create-test/chapter-wise"
          className="rounded-2xl bg-[#5988EF] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(89,136,239,0.28)] transition hover:bg-[#4f7de2]"
        >
          Create a Test
        </Link>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading tests...
          </div>
        ) : error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
            {error instanceof Error ? error.message : "Unable to load tests."}
          </div>
        ) : (
          <TestTable tests={data ?? []} />
        )}
      </div>
    </section>
  );
}

export default function TestCreationClient() {
  return <TestCreationView />;
}
