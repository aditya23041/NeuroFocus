"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Helper to determine active link classes
  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return isActive
      ? "flex items-center gap-3 px-4 py-3 rounded-lg text-secondary font-bold border-r-2 border-secondary bg-surface-variant/10 transition-all active:scale-95 duration-200"
      : "flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-variant/20 transition-all active:scale-95 duration-200";
  };

  // Determine bottom CTA behavior based on route
  const getCtaConfig = () => {
    if (pathname === "/monitor") {
      return {
        label: "End Session",
        icon: "stop",
        action: () => router.push("/"),
        className: "bg-error-container text-on-error-container hover:bg-error transition-colors",
      };
    } else if (pathname === "/setup") {
      return {
        label: "Start Session",
        icon: "play_arrow",
        action: () => {
          // Find if there's a start button trigger in the setup page
          const btn = document.getElementById("setup-start-btn");
          if (btn) btn.click();
          else router.push("/monitor");
        },
        className: "bg-primary-container text-on-primary-container hover:bg-inverse-primary hover:shadow-primary/20",
      };
    } else {
      return {
        label: "Start Session",
        icon: "play_arrow",
        action: () => router.push("/setup"),
        className: "bg-primary-container text-on-primary-container hover:bg-primary-container/80 shadow-[0_0_10px_rgba(80,70,229,0.3)]",
      };
    }
  };

  const cta = getCtaConfig();

  return (
    <nav className="bg-slate-glass h-screen w-64 fixed left-0 top-0 backdrop-blur-xl border-r border-white/10 shadow-sm flex flex-col py-stack-lg z-50">
      {/* Brand Header */}
      <div className="px-gutter mb-stack-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(80,70,229,0.2)]">
          <span className="material-symbols-outlined text-primary fill-icon font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>
            psychology
          </span>
        </div>
        <div>
          <h1 className="font-headline-lg text-primary text-[20px] leading-tight font-bold tracking-tight">
            NeuroFocus
          </h1>
          <p className="font-label-caps text-on-surface-variant text-[10px] uppercase tracking-wider">
            Precision Study
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-stack-sm flex flex-col gap-2">
        <Link href="/monitor" className={getLinkClass("/monitor")}>
          <span className="material-symbols-outlined text-[20px]">sensors</span>
          <span className="font-title-md text-[14px]">Monitor</span>
        </Link>
        <Link href="/" className={getLinkClass("/")}>
          <span className="material-symbols-outlined text-[20px]">insights</span>
          <span className="font-title-md text-[14px]">Analytics</span>
        </Link>
        <Link href="/setup" className={getLinkClass("/setup")}>
          <span className="material-symbols-outlined text-[20px]">tune</span>
          <span className="font-title-md text-[14px]">Setup</span>
        </Link>
      </div>

      {/* Dynamic CTA at the bottom */}
      <div className="px-gutter mt-auto">
        <button
          onClick={cta.action}
          className={`w-full font-title-md text-[14px] py-3 rounded-lg transition-all active:scale-95 duration-200 flex justify-center items-center gap-2 shadow-sm ${cta.className}`}
        >
          <span className="material-symbols-outlined text-[18px]">{cta.icon}</span>
          {cta.label}
        </button>
      </div>
    </nav>
  );
}
