import type { ReactNode } from "react";
import CreateTestTabs from "@/components/CreateTestTabs";

export default function CreateTestLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <section className="px-5 py-6 md:px-8 md:py-8">
      <CreateTestTabs />
      <div className="mt-8">{children}</div>
    </section>
  );
}
