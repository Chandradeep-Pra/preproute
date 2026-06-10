import type { ReactNode } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <Sidebar />
      <main className="flex-1">
        <Providers>
          <Topbar />
          <div className="px-5 md:px-8">
            <Breadcrumbs />
          </div>
          {children}
        </Providers>
      </main>
    </div>
  );
}
