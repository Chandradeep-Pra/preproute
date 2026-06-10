"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/test-creation/create-test/chapter-wise", label: "Chapterwise" },
  { href: "/test-creation/create-test/pyq", label: "PYQ" },
  { href: "/test-creation/create-test/mock-test", label: "Mock Test" },
];

export default function CreateTestTabs() {
  const pathname = usePathname();

  return (
    <div className="mt-2 w-full max-w-[470px] rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-3 gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "rounded-2xl px-4 py-3 text-center text-sm font-medium transition",
                active
                  ? "bg-[#EEF3FF] text-[#3558E8] shadow-[inset_0_0_0_1px_rgba(53,88,232,0.12)]"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-700",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
