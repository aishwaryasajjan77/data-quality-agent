"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6.5" height="7" rx="1.5"/>
        <rect x="10.5" y="1" width="6.5" height="4" rx="1.5"/>
        <rect x="1" y="11" width="6.5" height="6" rx="1.5"/>
        <rect x="10.5" y="8" width="6.5" height="9" rx="1.5"/>
      </svg>
    ),
  },
  {
    label: "Data Sources",
    href: "/sources",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="9" cy="4" rx="7" ry="2.5"/>
        <path d="M2 4v5c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V4"/>
        <path d="M2 9v5c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V9"/>
      </svg>
    ),
  },
  {
    label: "Anomalies",
    href: "/anomalies",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.13 2.36L1.36 14.27a1 1 0 00.87 1.5h13.54a1 1 0 00.87-1.5L9.87 2.36a1 1 0 00-1.74 0z"/>
        <line x1="9" y1="7" x2="9" y2="10.5"/>
        <circle cx="9" cy="13" r="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: "Script Runs",
    href: "/runs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5,2 16,9 5,16"/>
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-surface-1 border-r border-white/[0.04] flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14.5 5V11L8 15L1.5 11V5L8 1Z" fill="#6d5ff5" fillOpacity="0.5" stroke="#6d5ff5" strokeWidth="1.2"/>
              <circle cx="8" cy="8" r="2" fill="#6d5ff5"/>
            </svg>
          </div>
          <div>
            <span className="font-display font-bold text-[15px] text-zinc-100 tracking-tight">
              DataGuard
            </span>
            <span className="text-accent ml-1 text-[13px] font-medium">AI</span>
          </div>
        </div>
        <p className="text-[11px] text-muted mt-2 tracking-wide uppercase font-medium">
          Autonomous Quality Agent
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150",
                active
                  ? "bg-accent/10 text-accent-light border border-accent/15 shadow-glow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
              )}
            >
              <span className={clsx(active ? "text-accent" : "text-zinc-500")}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span className="w-2 h-2 rounded-full bg-success live-dot text-success" />
          Agent monitoring active
        </div>
      </div>
    </aside>
  );
}