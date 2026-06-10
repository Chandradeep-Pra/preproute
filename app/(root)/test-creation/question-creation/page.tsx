import { Suspense } from "react";
import QuestionCreationClient from "@/components/question-creation/QuestionCreationClient";

export default function QuestionCreationPage() {
  return (
    <Suspense
      fallback={
        <section className="px-5 py-6 md:px-8 md:py-8">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading question creation...
          </div>
        </section>
      }
    >
      <QuestionCreationClient />
    </Suspense>
  );
}
