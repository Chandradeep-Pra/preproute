"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/test-creation", label: "Test-creation" },
  { href: "/test-tracking", label: "Test-tracking" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-slate-200 bg-white px-2 py-5 md:min-h-screen md:w-1/6 md:border-b-0 md:border-r md:px-2 md:py-6">
      <div className="flex items-center justify-between gap-4 md:flex-col">
        <Image src="/logo.png" alt="Preproute logo" width={135} height={34} priority />
      </div>

      <nav className="mt-6 flex gap-2 overflow-x-auto pb-2 md:mt-10 md:flex-col md:gap-3 md:overflow-visible md:pb-0">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "inline-flex items-center rounded-l-lg px-2 py-3 text-sm font-medium transition",
                active
                  ? "bg-[#F8FAFF] border-l-4 border-[#384EC7]"
                  : "",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
