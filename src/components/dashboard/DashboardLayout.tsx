"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type DashboardRole = "citizen" | "collector" | "admin";

export interface NavItem {
  label: string;
  id: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  badge?: string | number;
}

interface DashboardLayoutProps {
  role: DashboardRole;
  currentTab: string;
  onTabChange: (tabId: string) => void;
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  agencyName?: string;
  userName?: string;
}

export default function DashboardLayout({
  role,
  currentTab,
  onTabChange,
  title,
  subtitle,
  headerAction,
  children,
  agencyName,
  userName,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const [storedUserName, setStoredUserName] = useState<string>("");

  useEffect(() => {
    if (!userName && typeof window !== "undefined") {
      const stored = localStorage.getItem("swmis_current_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.fullName) {
            setStoredUserName(parsed.fullName);
          }
        } catch {}
      }
    }
  }, [userName]);

  const activeDisplayName =
    userName ||
    storedUserName ||
    (role === "admin"
      ? "Agency Admin"
      : role === "collector"
      ? "Sanitation Driver"
      : "Resident Citizen");

  const avatarInitials =
    activeDisplayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "GL";

  // Role details mapping with simple, natural English labels
  const roleConfig = {
    citizen: {
      badge: "Citizen",
      badgeColor: "bg-[#eaf3ec] text-[#1f7a4d] border-[#1f7a4d]/20",
      defaultName: activeDisplayName,
      detail: "Community Resident",
      avatarInitials,
      navItems: [
        {
          label: "My Reports & Tracking",
          id: "tracker",
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
        },
        {
          label: "Report Flood & Drainage",
          id: "flood",
          badge: "Govt Alert",
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        },
        {
          label: "Waste & Drainage Agencies",
          id: "agencies",
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
        {
          label: "Book Big Pickup",
          id: "bulky",
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
      ],
    },
    collector: {
      badge: "Driver / Crew",
      badgeColor: "bg-[#fef3c7] text-[#92400e] border-[#f59e0b]/30",
      defaultName: activeDisplayName,
      detail: agencyName || "Waste Authority",
      avatarInitials,
      navItems: [
        {
          label: "Today's Jobs",
          id: "dispatch",
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          ),
        },
        {
          label: "My Stop List",
          id: "stops",
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          label: "Truck Status",
          id: "telemetry",
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
        },
      ],
    },
    admin: {
      badge: "Agency Admin",
      badgeColor: "bg-[#eaf3ec] text-[#123321] border-[#1f7a4d]/25",
      defaultName: activeDisplayName,
      detail: agencyName || "Waste Authority",
      avatarInitials,
      navItems: [
        {
          label: "Overview",
          id: "overview",
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
        },
        {
          label: "Assign Jobs to Drivers",
          id: "assign",
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        },
        {
          label: "Drivers & Agency Code",
          id: "fleet",
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
        },
      ],
    },
  }[role];

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch (e) {
      console.error("Sign out error:", e);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("swmis_current_user");
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] text-[#0e1310] flex flex-col md:flex-row antialiased selection:bg-[#eaf3ec] selection:text-[#123321]">
      {/* ================= DESKTOP SIDEBAR (WHITE BACKGROUND) ================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white text-zinc-900 border-r border-zinc-200 shrink-0 sticky top-0 h-screen z-30 justify-between select-none">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <Link href="/" className="font-heading text-xl font-bold tracking-tight text-[#0e1310] inline-flex items-center gap-1.5">
              <span>Green</span>
              <span className="text-[#1f7a4d]">Loop</span>
            </Link>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${roleConfig.badgeColor}`}>
              {roleConfig.badge}
            </span>
          </div>

          {/* Agency or User Info Card */}
          <div className="px-5 pt-4 pb-2">
            <div className="bg-[#f8faf8] rounded-xl p-3 border border-zinc-200/70">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1f7a4d]">
                {role === "citizen" ? "Account Type" : "Active Company"}
              </div>
              <div className="text-xs font-bold text-zinc-900 truncate mt-0.5">
                {role === "citizen" ? "Resident Citizen Portal" : agencyName || roleConfig.detail}
              </div>
              <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                Signed in as: <strong>{roleConfig.defaultName}</strong>
              </div>
            </div>
          </div>

          {/* Navigation Links with Green Active State */}
          <nav className="px-3 py-4 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
              Menu
            </div>
            {roleConfig.navItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  type="button"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer text-left ${
                    isActive
                      ? "bg-[#eaf3ec] text-[#123321] font-bold border-l-4 border-[#1f7a4d] shadow-2xs"
                      : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 font-medium"
                  }`}
                >
                  {role !== "citizen" && (
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-[#1f7a4d]" : "text-zinc-400"
                      }`}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-zinc-100 bg-[#fbfdfb]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#1f7a4d] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {roleConfig.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-zinc-900 truncate">
                {roleConfig.defaultName}
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                {roleConfig.badge}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            type="button"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer border border-zinc-200 shadow-2xs"
          >
            {role !== "citizen" && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE NAVIGATION (WHITE BACKGROUND) ================= */}
      <div className="md:hidden sticky top-0 z-40 bg-white text-zinc-900 border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-heading text-lg font-bold tracking-tight text-[#0e1310]">
          Green<span className="text-[#1f7a4d]">Loop</span>
          <span className="ml-2 text-xs font-medium text-zinc-500">[{roleConfig.badge}]</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
          className="p-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-semibold"
          aria-label="Toggle navigation menu"
        >
          {role === "citizen" ? (
            <span>{mobileOpen ? "Close" : "Menu"}</span>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white text-zinc-900 border-b border-zinc-200 p-4 space-y-2 z-40 sticky top-14 shadow-lg">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Menu
          </div>
          {roleConfig.navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                  isActive
                    ? "bg-[#eaf3ec] text-[#123321] font-bold border-l-4 border-[#1f7a4d]"
                    : "text-zinc-700 font-medium"
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-3 border-t border-zinc-100 mt-2 flex items-center justify-between">
            <span className="text-xs text-zinc-600">{roleConfig.defaultName}</span>
            <button
              onClick={handleSignOut}
              className="text-xs text-red-600 font-bold hover:underline"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP STATUS BAR */}
        <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-20 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Contextual Action Button */}
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </header>

        {/* WORKSPACE CONTENT BODY */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
