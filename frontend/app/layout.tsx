import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "DataGuard AI — Autonomous Data Quality Agent",
  description: "AI-powered data quality monitoring and remediation platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen bg-surface-0 text-zinc-200 antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen ml-[260px]">
          <main className="flex-1 p-8 relative">
            <div className="glow-bg" />
            <div className="relative z-10 max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}