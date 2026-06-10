import { Suspense } from "react";
import ChapterWiseForm from "@/components/test-creation/chapter-wise/ChapterWiseForm";

export default function ChapterWisePage() {
  return (
    <Suspense
      fallback={
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        </section>
      }
    >
      <ChapterWiseForm />
    </Suspense>
  );
}
