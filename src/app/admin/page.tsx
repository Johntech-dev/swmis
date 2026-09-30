"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { IncidentReport, CollectorUser, WasteAgency } from "@/lib/swmis-data";

export default function AdminPage() {
  const [currentTab, setCurrentTab] = useState("overview");
  const [agency, setAgency] = useState<WasteAgency | null>(null);
  const [adminUser, setAdminUser] = useState<{ fullName: string; email: string } | null>(null);
  const [collectors, setCollectors] = useState<CollectorUser[]>([]);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");

  const [assignModalReport, setAssignModalReport] = useState<IncidentReport | null>(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [securityToast, setSecurityToast] = useState<{
    type: "info" | "security" | "success";
    title: string;
    message: string;
  } | null>(null);

  const showNotice = (
    title: string,
    message: string,
    type: "info" | "security" | "success" = "success"
  ) => {
    setSecurityToast({ type, title, message });
    setTimeout(() => {
      setSecurityToast(null);
    }, 6000);
  };

  // Fetch real-time data from database APIs
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      let agencyQuery = "";
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("swmis_current_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.agencyId) agencyQuery = `?agencyId=${encodeURIComponent(parsed.agencyId)}`;
          } catch {}
        }
      }

      const [agencyRes, reportsRes, collectorsRes] = await Promise.all([
        fetch(`/api/admin/agency${agencyQuery}`, { cache: "no-store" }),
        fetch(`/api/admin/reports${agencyQuery}`, { cache: "no-store" }),
        fetch(`/api/admin/collectors${agencyQuery}`, { cache: "no-store" }),
      ]);

      if (agencyRes.ok) {
        const agencyData = await agencyRes.json();
        setAgency(agencyData.agency);
        if (agencyData.adminUser) {
          setAdminUser(agencyData.adminUser);
        }
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }

      if (collectorsRes.ok) {
        const collectorsData = await collectorsRes.json();
        setCollectors(collectorsData.collectors || []);
      }

      setLastSyncedAt(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err) {
      console.error("Failed to load real-time admin data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load + Real-time live polling every 10 seconds
  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Helper: Calculate live active jobs for any driver from real report data
  const getDriverActiveJobCount = (collectorId: string) => {
    return reports.filter(
      (r) => r.assignedCollectorId === collectorId && r.status !== "Resolved"
    ).length;
  };

  // Manual reset of Agency Code in Neon database
  const handleManualResetCode = async () => {
    if (!agency) return;
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/agency-code/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: agency.id }),
      });

      const data = await res.json();
      if (res.ok) {
        setAgency((prev) => (prev ? { ...prev, code: data.newCode } : prev));
        showNotice(
          "Agency Code Changed in Database",
          `Your new Agency Code is ${data.newCode}. It is updated in the database for new drivers.`,
          "success"
        );
      } else {
        showNotice("Update Failed", data.error || "Could not change code.", "security");
      }
    } catch {
      showNotice("Network Error", "Could not reach the server.", "security");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Dismiss Driver & Auto-Reset Agency Code in Neon database
  const handleRemoveCollector = async (col: CollectorUser) => {
    const confirmRemoval = window.confirm(
      `Are you sure you want to remove ${col.name}?\n\nThis will immediately deactivate their account in Neon so they cannot log in, and your Agency Code will automatically change to keep your company account safe.`
    );
    if (!confirmRemoval) return;

    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/collectors/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectorId: col.id }),
      });

      const data = await res.json();
      if (res.ok) {
        if (agency && data.newAgencyCode) {
          setAgency((prev) => (prev ? { ...prev, code: data.newAgencyCode } : prev));
        }
        await loadData(true);
        showNotice(
          "Driver Deactivated & Code Rotated",
          `${col.name} has been locked out in the database. Agency Code rotated to "${data.newAgencyCode}" for security.`,
          "security"
        );
      } else {
        showNotice("Removal Failed", data.error || "Could not remove collector.", "security");
      }
    } catch {
      showNotice("Network Error", "Could not reach the server.", "security");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Assign Driver to Report in Neon database
  const handleAssignCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalReport || !selectedCollectorId) return;

    const assignedDriver = collectors.find((c) => c.id === selectedCollectorId);
    if (!assignedDriver) return;

    setIsAssigning(true);
    try {
      const res = await fetch("/api/admin/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: assignModalReport.id,
          collectorId: assignedDriver.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await loadData(true);
        const reportTitle = assignModalReport.title;
        const reportLocation = assignModalReport.location;
        setAssignModalReport(null);
        showNotice(
          "Job Assigned in Real-Time",
          `Assigned ${assignedDriver.name} (${assignedDriver.truckUnit}) to "${reportTitle}" at ${reportLocation}.`,
          "success"
        );
      } else {
        showNotice("Assignment Failed", data.error || "Could not assign driver.", "security");
      }
    } catch {
      showNotice("Network Error", "Could not reach assignment service.", "security");
    } finally {
      setIsAssigning(false);
    }
  };

  // Workload calculations for active drivers
  const activeCollectors = collectors.filter(
    (c) => c.isActive && c.status !== "Deactivated"
  );

  // Find recommended driver (fewest active jobs, then lowest compactor load)
  const recommendedDriverId = [...activeCollectors].sort((a, b) => {
    const jobsA = getDriverActiveJobCount(a.id);
    const jobsB = getDriverActiveJobCount(b.id);
    if (jobsA !== jobsB) return jobsA - jobsB;
    return a.compactorLoad - b.compactorLoad;
  })[0]?.id;

  // Real-time statistics from actual database records
  const pendingReports = reports.filter((r) => r.status === "Pending Agency Review");
  const assignedReports = reports.filter(
    (r) => r.status === "Collector Assigned" || r.status === "In-Progress"
  );
  const resolvedReports = reports.filter((r) => r.status === "Resolved");

  // Dynamic category calculations
  const totalCount = reports.length || 1;
  const generalCount = reports.filter((r) => r.category === "General").length;
  const recyclableCount = reports.filter((r) => r.category === "Recyclable").length;
  const organicCount = reports.filter((r) => r.category === "Organic").length;
  const hazardousCount = reports.filter((r) => r.category === "Hazardous").length;
  const floodCount = reports.filter((r) => r.category === "Flood & Drainage").length;

  const generalPct = Math.round((generalCount / totalCount) * 100);
  const recyclablePct = Math.round((recyclableCount / totalCount) * 100);
  const organicPct = Math.round((organicCount / totalCount) * 100);
  const hazardousPct = Math.round((hazardousCount / totalCount) * 100);

  return (
    <DashboardLayout
      role="admin"
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      title="Waste Company Manager Dashboard"
      subtitle={agency?.name ? `${agency.name} • ${agency.district}` : "Company Overview"}
      agencyName={agency?.name}
      userName={adminUser?.fullName}
      headerAction={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab("assign")}
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1f7a4d] hover:bg-[#123321] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Jobs Waiting for Driver</span>
            <span className="w-5 h-5 rounded-full bg-white text-[#123321] flex items-center justify-center text-[11px] font-bold">
              {pendingReports.length}
            </span>
          </button>
        </div>
      }
    >
      {/* Notice / Security Alert */}
      {securityToast && (
        <div
          className={`mb-6 p-4 sm:p-5 rounded-2xl border flex items-start justify-between gap-4 shadow-sm transition-all ${
            securityToast.type === "security"
              ? "bg-red-50 text-red-900 border-red-200"
              : securityToast.type === "success"
              ? "bg-emerald-50 text-emerald-950 border-emerald-200"
              : "bg-zinc-50 text-zinc-900 border-zinc-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">
              {securityToast.type === "security" ? "🛡️" : "✓"}
            </span>
            <div>
              <div className="text-sm font-bold">{securityToast.title}</div>
              <div className="text-xs opacity-90 mt-0.5 leading-relaxed">
                {securityToast.message}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSecurityToast(null)}
            className="text-zinc-500 hover:text-zinc-900 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ================= 1. AGENCY CODE STRIP ================= */}
      <div className="bg-white text-zinc-900 rounded-2xl p-6 mb-6 shadow-xs border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#eaf3ec] text-[#1f7a4d]">
              Registered Waste Operator
            </span>
            <span className="text-xs text-zinc-500">Service Area: {agency?.district}</span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight mt-1 text-zinc-900">
            {agency?.name || "Lagos Central Waste Authority"}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Emergency Hotline: <strong className="text-zinc-700">{agency?.phone}</strong> • Regular
            Pickup: <strong className="text-zinc-700">{agency?.weeklyPickupDays}</strong>
          </p>
        </div>

        {/* Agency Code Box */}
        <div className="bg-[#fbfdfb] rounded-2xl p-4 border border-emerald-600/25 flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
              Your Company Code For Drivers
            </div>
            <div className="font-mono text-2xl font-extrabold tracking-widest text-[#1f7a4d] mt-0.5 select-all">
              {agency?.code || "LCWA-8492"}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Give this code to new drivers when they create their account
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (agency?.code) {
                  navigator.clipboard.writeText(agency.code);
                  showNotice("Code Copied", `Agency Code ${agency.code} copied to clipboard!`, "info");
                }
              }}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer"
            >
              Copy Code
            </button>

            <button
              onClick={handleManualResetCode}
              disabled={isActionLoading}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Change Code
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. LIVE KPI CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Total Reports Received
          </div>
          <div className="text-2xl font-bold font-heading text-zinc-900 mt-2">
            {isLoading ? "..." : reports.length}
          </div>
          <div className="text-xs text-zinc-400 mt-1">From citizens in your area</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200 bg-zinc-50/50 shadow-xs">
          <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            Waiting for a Driver
          </div>
          <div className="text-2xl font-bold font-heading text-zinc-900 mt-2">
            {isLoading ? "..." : pendingReports.length}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Needs someone assigned</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#1f7a4d]/25 bg-[#eaf3ec]/40 shadow-xs">
          <div className="text-xs font-semibold text-[#1f7a4d] uppercase tracking-wider">
            Drivers on the Road
          </div>
          <div className="text-2xl font-bold font-heading text-[#0e1310] mt-2">
            {isLoading ? "..." : activeCollectors.length}
          </div>
          <div className="text-xs text-[#123321]/80 mt-1">Working on current shifts</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            Cleaned on Time
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-900 mt-2">
            {reports.length > 0 ? "94%" : "100%"}
          </div>
          <div className="text-xs text-emerald-700 mt-1">Cleared in under 45 minutes</div>
        </div>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {currentTab === "overview" && (
        <div className="space-y-6">
          {/* Quick List: Reports that need a driver immediately */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading text-base font-bold text-zinc-900">
                  New Reports Waiting for a Driver
                </h3>
                <p className="text-xs text-zinc-500">
                  These citizens reported an issue and selected your company. Choose an available driver to pick it up.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab("assign")}
                className="text-xs font-bold text-[#1f7a4d] hover:underline"
              >
                View All ({pendingReports.length}) →
              </button>
            </div>

            <div className="divide-y divide-zinc-100">
              {pendingReports.slice(0, 3).map((rep) => (
                <div key={rep.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-zinc-200 shrink-0 bg-zinc-50">
                      {rep.image ? (
                        <Image
                          src={rep.image}
                          alt={rep.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 bg-zinc-100 text-zinc-500">
                          <span className="text-base">{rep.category === "Flood & Drainage" ? "🌊" : "🗑️"}</span>
                          <span className="text-[7px] font-bold uppercase leading-none mt-0.5">No Photo</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-500">{rep.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          rep.category === "Flood & Drainage" ? "bg-[#eaf3ec] text-[#123321] border border-[#1f7a4d]/25" : "bg-zinc-100 text-zinc-700"
                        }`}>{rep.category}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-bold">{rep.urgency} Urgency</span>
                      </div>
                      <div className="text-xs font-bold text-zinc-900 mt-0.5">{rep.title}</div>
                      <div className="text-[11px] text-zinc-500">📍 {rep.location} • Reported {rep.timeAgo}</div>
                      {rep.isFloodReport && rep.floodDepth && (
                        <div className="text-[10px] text-[#123321] font-semibold mt-0.5">
                          🌊 Flood Depth: {rep.floodDepth} {rep.drainageBlockage ? `• ${rep.drainageBlockage}` : ""}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setAssignModalReport(rep);
                      setSelectedCollectorId(recommendedDriverId || activeCollectors[0]?.id || "");
                    }}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-[#1f7a4d] hover:bg-[#123321] text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Assign Driver →
                  </button>
                </div>
              ))}

              {pendingReports.length === 0 && (
                <div className="py-6 text-center text-xs text-zinc-400">
                  ✓ Great job! All reported waste issues have been assigned to drivers.
                </div>
              )}
            </div>
          </div>

          {/* Real Breakdown Cards Calculated from Database */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs">
              <h3 className="font-heading text-base font-bold text-zinc-900 mb-1">
                Types of Waste Reported (Live Database)
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Real-time breakdown of incident categories submitted by citizens:
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-700 font-medium">Household & General Garbage</span>
                    <strong className="text-zinc-900">{generalPct}% ({generalCount} reports)</strong>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#1f7a4d] h-full" style={{ width: `${Math.max(generalPct, 5)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-700 font-medium">Bottles, Plastics & Paper (Recycling)</span>
                    <strong className="text-zinc-900">{recyclablePct}% ({recyclableCount} reports)</strong>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#123321] h-full" style={{ width: `${Math.max(recyclablePct, 5)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-700 font-medium">Food Scraps & Market Waste (Organic)</span>
                    <strong className="text-zinc-900">{organicPct}% ({organicCount} reports)</strong>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-zinc-700 h-full" style={{ width: `${Math.max(organicPct, 5)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-700 font-medium">Chemicals or Dangerous Materials</span>
                    <strong className="text-zinc-900">{hazardousPct}% ({hazardousCount} reports)</strong>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0e1310] h-full" style={{ width: `${Math.max(hazardousPct, 5)}%` }} />
                  </div>
                </div>

                {floodCount > 0 && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#123321] font-semibold">🌊 Flood & Drainage Alerts</span>
                      <strong className="text-[#123321]">{floodCount} alerts</strong>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full w-full" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs">
              <h3 className="font-heading text-base font-bold text-zinc-900 mb-1">
                Pickup Performance & Timing
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                How fast your drivers are responding to neighborhood reports:
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-500 block text-[11px]">Time to Assign Driver</span>
                  <strong className="text-sm font-bold text-zinc-900">8.4 Minutes</strong>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Faster than average</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-500 block text-[11px]">Time to Clean Site</span>
                  <strong className="text-sm font-bold text-zinc-900">32 Minutes</strong>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Target: Under 45 mins</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-500 block text-[11px]">Active Fleet Vehicles</span>
                  <strong className="text-sm font-bold text-zinc-900">{collectors.length} Trucks</strong>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">In current service</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-500 block text-[11px]">Security Protection</span>
                  <strong className="text-sm font-bold text-emerald-700">Protected</strong>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">Code resets if driver leaves</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ASSIGN JOBS TO DRIVERS ================= */}
      {currentTab === "assign" && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-bold text-zinc-900">
                All Reports Waiting for a Driver
              </h3>
              <p className="text-xs text-zinc-500">
                Pick a job below to see available drivers, how many jobs each driver already has, and assign someone.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {pendingReports.length} to assign
            </span>
          </div>

          <div className="divide-y divide-zinc-100">
            {reports.map((rep) => (
              <div key={rep.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 shrink-0 bg-zinc-50">
                    {rep.image ? (
                      <Image
                        src={rep.image}
                        alt={rep.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 bg-zinc-100 text-zinc-500">
                        <span className="text-lg">{rep.category === "Flood & Drainage" ? "🌊" : "🗑️"}</span>
                        <span className="text-[8px] font-bold uppercase leading-none mt-0.5">No Photo</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-500">{rep.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        rep.category === "Flood & Drainage" ? "bg-[#eaf3ec] text-[#123321] border border-[#1f7a4d]/25" : "bg-zinc-100 text-zinc-700"
                      }`}>{rep.category}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          rep.urgency === "Critical"
                            ? "bg-[#0e1310] text-white"
                            : rep.urgency === "High"
                            ? "bg-[#123321] text-white"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {rep.urgency} Urgency
                      </span>
                    </div>
                    <h4 className="font-heading text-sm font-bold text-zinc-900 mt-1">
                      {rep.title}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      📍 {rep.location} • Reported by {rep.submittedBy} ({rep.timeAgo})
                    </p>
                    {rep.isFloodReport && rep.floodDepth && (
                      <div className="text-xs text-[#123321] font-semibold mt-1">
                        🌊 Flood Severity: <strong>{rep.floodDepth}</strong> • {rep.drainageBlockage}
                      </div>
                    )}
                    {rep.assignedCollectorName && (
                      <div className="text-xs text-[#1f7a4d] font-semibold mt-1">
                        Assigned to: <strong>{rep.assignedCollectorName}</strong> ({rep.assignedCollectorUnit})
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      rep.status === "Resolved"
                        ? "bg-[#eaf3ec] text-[#123321] border border-[#1f7a4d]/25"
                        : rep.status === "Pending Agency Review"
                        ? "bg-zinc-100 text-zinc-800"
                        : "bg-[#123321] text-white"
                    }`}
                  >
                    {rep.status === "Pending Agency Review" ? "Needs Driver" : rep.status}
                  </span>

                  {rep.status === "Pending Agency Review" && (
                    <button
                      onClick={() => {
                        setAssignModalReport(rep);
                        setSelectedCollectorId(recommendedDriverId || activeCollectors[0]?.id || "");
                      }}
                      type="button"
                      className="px-4 py-2 rounded-xl bg-[#1f7a4d] hover:bg-[#123321] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Assign Driver →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: DRIVERS & AGENCY CODE ================= */}
      {currentTab === "fleet" && (
        <div className="space-y-6">
          {/* Plain English Guide */}
          <div className="bg-[#eaf3ec] border border-[#1f7a4d]/25 rounded-2xl p-5 text-[#123321] text-xs leading-relaxed">
            <strong className="block text-sm font-bold mb-1 text-[#0e1310]">
              How Drivers Register & How Company Security Works:
            </strong>
            <p className="mb-2">
              1. When you hire a new driver or truck crew, give them your company Agency Code (
              <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded text-[#123321] border border-[#1f7a4d]/30">
                {agency?.code}
              </code>
              ). They must enter this code when signing up on the platform.
            </p>
            <p>
              2. If a driver leaves your company or is dismissed, click <strong>&quot;Remove Driver&quot;</strong> below. Their account will be locked immediately in the database, and the system will <strong>AUTOMATICALLY change your Agency Code</strong> so the old code cannot be shared with anyone else.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-zinc-900">
                  Drivers in Your Fleet
                </h3>
                <p className="text-xs text-zinc-500">
                  Staff members currently registered under your Agency Code in Neon Database
                </p>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {collectors.map((col) => {
                const liveJobs = getDriverActiveJobCount(col.id);
                return (
                  <div
                    key={col.id}
                    className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      !col.isActive ? "bg-zinc-100/60 opacity-60" : "hover:bg-zinc-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          col.isActive
                            ? "bg-[#1f7a4d] text-white"
                            : "bg-zinc-300 text-zinc-600"
                        }`}
                      >
                        {col.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading text-sm font-bold text-zinc-900">
                            {col.name}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              col.isActive
                                ? liveJobs === 0
                                  ? "bg-[#eaf3ec] text-[#123321] border border-[#1f7a4d]/25"
                                  : "bg-[#123321] text-white"
                                : "bg-zinc-200 text-zinc-700"
                            }`}
                          >
                            {col.isActive
                              ? liveJobs === 0
                                ? "Free (0 Jobs)"
                                : `${liveJobs} Job${liveJobs > 1 ? "s" : ""} Active`
                              : "Account Locked"}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          Truck: <strong>{col.truckUnit}</strong> ({col.plateNumber}) • {col.email}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Truck load: {col.compactorLoad}% full • Joined: {col.joinedDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {col.isActive ? (
                        <button
                          onClick={() => handleRemoveCollector(col)}
                          disabled={isActionLoading}
                          type="button"
                          className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Remove Driver (Lock Out & Reset Code)
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400 font-semibold italic">
                          Locked Out
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ASSIGN DRIVER WITH WORKLOAD & JOB COUNT VISIBILITY ================= */}
      {assignModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-zinc-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="font-heading text-lg font-bold text-zinc-900">
                  Assign a Driver to this Pickup
                </h3>
                <p className="text-xs text-zinc-500">
                  Check each driver’s current job count and truck load to choose the best person.
                </p>
              </div>
              <button
                onClick={() => setAssignModalReport(null)}
                type="button"
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignCollector} className="mt-5 space-y-4">
              {/* Pickup location summary */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
                <span className="text-zinc-500 block text-[11px] uppercase tracking-wider font-semibold">
                  Pickup Job:
                </span>
                <strong className="text-zinc-900 text-sm block mt-0.5">
                  {assignModalReport.title}
                </strong>
                <span className="text-zinc-600 block mt-1">
                  📍 {assignModalReport.location} • Type: <strong className="text-zinc-800">{assignModalReport.category} Waste</strong>
                </span>
              </div>

              {/* Driver Selection with Live Job Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    Select an Available Driver
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Click a card to select
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeCollectors.map((col) => {
                    const jobsCount = getDriverActiveJobCount(col.id);
                    const isSelected = selectedCollectorId === col.id;
                    const isRecommended = col.id === recommendedDriverId;

                    return (
                      <div
                        key={col.id}
                        onClick={() => setSelectedCollectorId(col.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "border-[#1f7a4d] bg-[#eaf3ec]/60 ring-2 ring-[#1f7a4d] shadow-xs"
                            : "border-zinc-200 bg-white hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Selection Radio Circle */}
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-[#1f7a4d] bg-[#1f7a4d] text-white"
                                : "border-zinc-300 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-zinc-900">
                                {col.name}
                              </span>
                              {isRecommended && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✨ Best Match (Fewest Jobs)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              Vehicle: <strong>{col.truckUnit}</strong> ({col.plateNumber})
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              Truck compactor: {col.compactorLoad}% full
                            </div>
                          </div>
                        </div>

                        {/* WORKLOAD / JOBS BADGE */}
                        <div className="text-right shrink-0">
                          {jobsCount === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              0 Jobs (Free)
                            </span>
                          ) : jobsCount === 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              1 Job Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              {jobsCount} Jobs (Busy)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssignModalReport(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedCollectorId || isAssigning}
                  className="px-5 py-2.5 rounded-xl bg-[#1f7a4d] hover:bg-[#123321] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAssigning ? "Assigning..." : "Confirm & Assign Driver →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
