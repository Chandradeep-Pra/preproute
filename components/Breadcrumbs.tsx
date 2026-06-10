"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function titleCase(segment: string) {
  if (segment.toLowerCase() === "pyq") {
    return "PYQ";
  }

  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const items: { label: string; href: string; key: string }[] = [];

  if (segments[0] === "dashboard") {
    items.push({ label: "Dashboard", href: "/dashboard", key: "dashboard" });
  }

  if (segments[0] === "test-creation") {
    items.push({
      label: "Test Creation",
      href: "/test-creation",
      key: "test-creation",
    });

    if (segments[1] === "create-test") {
      items.push({
        label: "Create Test",
        href: "/test-creation/create-test",
        key: "create-test",
      });
    }

    if (segments[1] === "question-creation") {
      items.push({
        label: "Question Creation",
        href: "/test-creation/question-creation",
        key: "question-creation",
      });

      if (segments[2] === "preview-publish") {
        items.push({
          label: "Preview & Publish",
          href: "/test-creation/question-creation/preview-publish",
          key: "preview-publish",
        });
      }
    }

    if (segments[2] && segments[1] !== "question-creation") {
      items.push({
        label: titleCase(segments[2]),
        href: pathname,
        key: segments[2],
      });
    }
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-2 whitespace-nowrap text-sm text-slate-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <span key={`${item.key}-${index}`} className="flex items-center gap-2">
              {isLast ? (
                <span className="font-medium text-slate-700">{item.label}</span>
              ) : (
                <Link href={item.href} className="transition hover:text-slate-900">
                  {item.label}
                </Link>
              )}
              {!isLast ? <span className="text-slate-300">/</span> : null}
            </span>
          );
        })}
      </ol>
    </nav>
  );
}
