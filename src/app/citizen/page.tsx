"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  IncidentReport,
  WasteCategory,
  ReportUrgency,
  WasteAgency,
} from "@/lib/swmis-data";

// GreenLoop SWMIS - Citizen Reporting & Triage Portal
const NIGERIAN_STATES = [
  "Ekiti State",
  "Lagos State",
  "Abuja (FCT)",
  "Ondo State",
  "Osun State",
  "Oyo State",
  "Ogun State",
  "Edo State",
  "Delta State",
  "Rivers State",
  "Kano State",
  "Kaduna State",
  "Enugu State",
  "Anambra State",
  "Abia State",
  "Adamawa State",
  "Akwa Ibom State",
  "Bauchi State",
  "Bayelsa State",
  "Benue State",
  "Borno State",
  "Cross River State",
  "Ebonyi State",
  "Gombe State",
  "Imo State",
  "Jigawa State",
  "Katsina State",
  "Kebbi State",
  "Kogi State",
  "Kwara State",
  "Nasarawa State",
  "Niger State",
  "Plateau State",
  "Sokoto State",
  "Taraba State",
  "Yobe State",
  "Zamfara State",
];

export default function CitizenPage() {
  const [currentTab, setCurrentTab] = useState("tracker");
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [agencies, setAgencies] = useState<WasteAgency[]>([]);
  const [filter, setFilter] = useState<"all" | "mine" | "active" | "resolved">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [citizenName, setCitizenName] = useState<string>("");
  const [citizenEmail, setCitizenEmail] = useState<string>("");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Form states for new incident report (completely dynamic - empty initial values)
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newCityLga, setNewCityLga] = useState("");
  const [newState, setNewState] = useState("Ekiti State");
  const [newGpsCoords, setNewGpsCoords] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newCategory, setNewCategory] = useState<WasteCategory>("General");
  const [newUrgency, setNewUrgency] = useState<ReportUrgency>("Normal");
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Dedicated Government Flood & Drainage Emergency state (completely dynamic)
  const [floodStreet, setFloodStreet] = useState("");
  const [floodLga, setFloodLga] = useState("Ado-Ekiti Central / Basin");
  const [floodState, setFloodState] = useState("Ekiti State");
  const [floodDepth, setFloodDepth] = useState<
    "Ankle-Deep" | "Knee-Deep" | "Waist-Deep (Severe)" | "Submerged Infrastructure"
  >("Knee-Deep");
  const [drainageCause, setDrainageCause] = useState("Plastic & Waste Blockage in Storm Canal");
  const [floodUrgency, setFloodUrgency] = useState<ReportUrgency>("Critical");
  const [affectedInfra, setAffectedInfra] = useState("");
  const [floodAgencyId, setFloodAgencyId] = useState("");
  const [floodPhoto, setFloodPhoto] = useState<string>("");
  const [floodIsSubmitting, setFloodIsSubmitting] = useState(false);
  const [floodSuccessToast, setFloodSuccessToast] = useState<string | null>(null);

  // Bulky pickup form state (dynamic date tomorrow)
  const [bulkyWasteType, setBulkyWasteType] = useState("Discarded Furniture / Mattresses");
  const [bulkyAddress, setBulkyAddress] = useState("");
  const [bulkyDate, setBulkyDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [bulkyAgencyId, setBulkyAgencyId] = useState("");
  const [bulkySuccess, setBulkySuccess] = useState(false);
  const [bulkyIsSubmitting, setBulkyIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // Load real-time citizen data and authenticated session from Neon database
  const loadCitizenData = useCallback(async () => {
    try {
      let resolvedEmail = "";
      
      // 1. Fetch current logged in user session
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData?.user) {
            if (meData.user.fullName) setCitizenName(meData.user.fullName);
            if (meData.user.email) {
              setCitizenEmail(meData.user.email);
              resolvedEmail = meData.user.email;
            }
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }

      // Fallback to localStorage cache if session endpoint had network lag
      if (!resolvedEmail && typeof window !== "undefined") {
        const stored = localStorage.getItem("swmis_current_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.fullName) setCitizenName(parsed.fullName);
            if (parsed.email) {
              setCitizenEmail(parsed.email);
              resolvedEmail = parsed.email;
            }
          } catch {}
        }
      }

      const queryParam = resolvedEmail ? `?email=${encodeURIComponent(resolvedEmail)}` : "";

      // 2. Fetch live reports and registered agencies from Neon DB
      const [reportsRes, agenciesRes] = await Promise.all([
        fetch(`/api/citizen/reports${queryParam}`, { cache: "no-store" }),
        fetch("/api/agencies", { cache: "no-store" }),
      ]);

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }

      if (agenciesRes.ok) {
        const agenciesData = await agenciesRes.json();
        const loadedAgencies: WasteAgency[] = agenciesData.agencies || [];
        setAgencies(loadedAgencies);

        if (loadedAgencies.length > 0) {
          const firstAgency = loadedAgencies[0];
          setSelectedAgencyId((prev) => {
            const exists = loadedAgencies.some((a) => a.id === prev);
            return exists ? prev : firstAgency.id;
          });
          setBulkyAgencyId((prev) => {
            const exists = loadedAgencies.some((a) => a.id === prev);
            return exists ? prev : firstAgency.id;
          });
          setFloodAgencyId((prev) => {
            const exists = loadedAgencies.some((a) => a.id === prev);
            return exists ? prev : firstAgency.id;
          });

          // Sync default state from first agency if available
          if (/ekiti/i.test(firstAgency.name) || /ekiti/i.test(firstAgency.district)) {
            setNewState("Ekiti State");
            setFloodState("Ekiti State");
          } else if (/lagos/i.test(firstAgency.name) || /lagos/i.test(firstAgency.district)) {
            setNewState("Lagos State");
            setFloodState("Lagos State");
          }
        }
      }
    } catch (err) {
      console.error("Error loading citizen data:", err);
    }
  }, []);

  // Initial load + Real-time auto-sync every 10 seconds
  useEffect(() => {
    loadCitizenData();

    const interval = setInterval(() => {
      loadCitizenData();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadCitizenData]);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (filter === "mine") return r.isMyReport;
    if (filter === "active") {
      return (
        r.status === "Pending Agency Review" ||
        r.status === "Collector Assigned" ||
        r.status === "In-Progress"
      );
    }
    if (filter === "resolved") {
      return r.status === "Resolved";
    }
    return true;
  });

  // Calculate statistics from live reports
  const totalCount = reports.length;
  const myReportsCount = reports.filter((r) => r.isMyReport).length;
  const pendingCount = reports.filter((r) => r.status === "Pending Agency Review").length;
  const inProgressCount = reports.filter(
    (r) => r.status === "Collector Assigned" || r.status === "In-Progress"
  ).length;
  const resolvedCount = reports.filter((r) => r.status === "Resolved").length;
  const floodCount = reports.filter((r) => r.category === "Flood & Drainage" || r.isFloodReport).length;

  // Active highlighted report for real-time tracking: prioritizes the logged-in citizen's own report
  const myReports = reports.filter((r) => r.isMyReport);
  const activeReport =
    (selectedReportId ? reports.find((r) => r.id === selectedReportId) : null) ||
    myReports.find((r) => r.status === "Collector Assigned" || r.status === "In-Progress") ||
    myReports.find((r) => r.status === "Pending Agency Review") ||
    myReports[0] ||
    reports.find((r) => r.status === "Collector Assigned" || r.status === "In-Progress") ||
    reports[0] ||
    null;

  // Exact GPS tagger for standard waste incident report
  const handleUseGpsForWasteReport = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      showToast("Acquiring exact GPS coordinates...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coordsStr = `GPS: ${pos.coords.latitude.toFixed(4)} N, ${pos.coords.longitude.toFixed(4)} E`;
          setNewGpsCoords(coordsStr);
          showToast(`Exact GPS tagged: ${coordsStr}`);
        },
        () => {
          showToast("Could not access device GPS. Please confirm your street and state above.");
        },
        { timeout: 8000 }
      );
    } else {
      showToast("Geolocation not supported by this browser.");
    }
  };

  const handleUseGps = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      showToast("Acquiring GPS coordinates...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const locationStr = `GPS: ${pos.coords.latitude.toFixed(4)} N, ${pos.coords.longitude.toFixed(4)} E`;
          setFloodStreet(locationStr);
          showToast(`Location tagged: ${locationStr}`);
        },
        () => {
          showToast("GPS unavailable. Please type your street and state.");
        },
        { timeout: 7000 }
      );
    } else {
      showToast("Geolocation not supported by this browser.");
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim()) {
      showToast("Please provide the street address or landmark.");
      return;
    }
    setIsSubmitting(true);

    const isFlood = newCategory === "Flood & Drainage";

    let calculatedLocation = "";
    if (newGpsCoords) {
      calculatedLocation = `${newGpsCoords} (${newStreet.trim()}${newCityLga.trim() ? ", " + newCityLga.trim() : ""}, ${newState})`;
    } else {
      calculatedLocation = `${newStreet.trim()}${newCityLga.trim() ? ", " + newCityLga.trim() : ""}, ${newState}, Nigeria`;
    }

    try {
      const res = await fetch("/api/citizen/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim() || (isFlood ? "Flash Flood Alert" : "Waste overflow incident reported"),
          description: newDescription.trim() || "Incident reported by resident via GreenLoop citizen portal.",
          location: calculatedLocation,
          category: newCategory,
          urgency: newUrgency,
          agencyId: selectedAgencyId,
          image: selectedPhoto || "",
          citizenEmail: citizenEmail || undefined,
          isFloodReport: isFlood,
          floodDepth: isFlood ? "Knee-Deep" : undefined,
          drainageBlockage: isFlood ? "Storm drain obstructed with street refuse" : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await loadCitizenData();
        setIsModalOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewStreet("");
        setNewCityLga("");
        setNewGpsCoords("");
        setSelectedPhoto("");
        showToast(data.message || "Report submitted successfully to the waste agency.");
      } else {
        showToast(data.error || "Failed to submit report.");
      }
    } catch {
      showToast("Network error: Could not submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFloodReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFloodIsSubmitting(true);

    try {
      const res = await fetch("/api/citizen/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Flash Flood & Drainage Alert: ${floodStreet}`,
          description: `Severe flood emergency reported by citizen. Depth: ${floodDepth}. Blockage: ${drainageCause}. Impact: ${affectedInfra}. Immediate government drainage clearance requested.`,
          location: `${floodStreet}, ${floodLga ? floodLga + ", " : ""}${floodState}, Nigeria`,
          category: "Flood & Drainage",
          urgency: floodUrgency,
          agencyId: floodAgencyId,
          image: floodPhoto || "",
          citizenEmail: citizenEmail || undefined,
          isFloodReport: true,
          floodDepth,
          drainageBlockage: drainageCause,
          affectedInfrastructure: affectedInfra,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await loadCitizenData();
        setFloodSuccessToast(`Emergency Flood Alert #${data.report?.id || ""} transmitted to authorities!`);
        setTimeout(() => {
          setFloodSuccessToast(null);
          setCurrentTab("tracker");
        }, 2200);
      } else {
        showToast(data.error || "Failed to submit flood alert.");
      }
    } catch {
      showToast("Network error: Could not transmit alert.");
    } finally {
      setFloodIsSubmitting(false);
    }
  };

  const handleBulkySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkyIsSubmitting(true);

    try {
      const res = await fetch("/api/citizen/bulky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulkyWasteType,
          bulkyAddress,
          bulkyDate,
          bulkyAgencyId,
          citizenEmail: citizenEmail || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await loadCitizenData();
        setBulkySuccess(true);
        setTimeout(() => {
          setBulkySuccess(false);
          setCurrentTab("tracker");
        }, 1600);
      } else {
        showToast(data.error || "Failed to schedule bulky pickup.");
      }
    } catch {
      showToast("Network error: Could not schedule bulky pickup.");
    } finally {
      setBulkyIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      role="citizen"
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      title={
        currentTab === "flood"
          ? "Government Flood & Drainage Incident Portal"
          : "Citizen Waste & Environmental Incident Portal"
      }
      subtitle={
        currentTab === "flood"
          ? "Citizens across all locations can report street flooding, clogged stormwater canals, and drainage crises directly to the State Government"
          : "Report community waste and flood issues and track dispatch resolution with municipal authorities"
      }
      userName={citizenName || "Resident Citizen"}
      headerAction={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab("flood")}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#123321] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#0e1310] transition-all shadow-sm cursor-pointer border border-[#123321]"
          >
            <span>Report Flood to Govt</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1f7a4d] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#123321] transition-all shadow-sm cursor-pointer"
          >
            <span>Report Waste</span>
          </button>
        </div>
      }
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="mb-6 p-4 rounded-xl bg-[#123321] text-emerald-300 border border-emerald-500/30 font-medium text-xs shadow-lg flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="text-white/60 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* ================= 1. DASHBOARD METRIC SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Total Community Reports
          </div>
          <div className="text-2xl font-bold font-heading text-zinc-900 mt-2">{totalCount}</div>
          <div className="text-xs text-zinc-400 mt-1">Waste & flood incidents</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#1f7a4d]/25 bg-[#eaf3ec]/40 shadow-xs">
          <div className="text-xs font-semibold text-[#1f7a4d] uppercase tracking-wider">
            Flood Alerts
          </div>
          <div className="text-2xl font-bold font-heading text-[#0e1310] mt-2">{floodCount}</div>
          <div className="text-xs text-[#123321]/80 mt-1">Routed to Govt Drainage Desk</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 bg-zinc-50/50 shadow-xs">
          <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            Pending Review
          </div>
          <div className="text-2xl font-bold font-heading text-[#0e1310] mt-2">{pendingCount}</div>
          <div className="text-xs text-zinc-500 mt-1">Awaiting dispatch assignment</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Resolved & Cleared
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-900 mt-2">{resolvedCount}</div>
          <div className="text-xs text-emerald-700/80 mt-1">Verified clean & drained sites</div>
        </div>
      </div>

      {/* ================= TAB 1: INCIDENT TRACKER ================= */}
      {currentTab === "tracker" && (
        <div className="space-y-6">
          {/* Active Live Progress Tracker Card */}
          {activeReport ? (
            <div className="bg-white rounded-2xl border border-emerald-500/30 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      Live Dispatch Tracker
                    </span>
                    <span className="text-xs font-mono text-zinc-400">ID: {activeReport.id}</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-zinc-900 mt-1.5">
                    {activeReport.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {activeReport.location} • Submitted to:{" "}
                    <strong className="text-zinc-700">{activeReport.agencyName}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      activeReport.status === "Resolved"
                        ? "bg-[#eaf3ec] text-[#123321] border border-[#1f7a4d]/30"
                        : activeReport.status === "Pending Agency Review"
                        ? "bg-zinc-100 text-zinc-800"
                        : "bg-[#123321] text-white"
                    }`}
                  >
                    {activeReport.status}
                  </span>
                  <div className="text-[11px] text-zinc-400 mt-1">{activeReport.timeAgo}</div>
                </div>
              </div>

              {/* 4-Step Progress Line */}
              <div className="pt-5 pb-2">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-[#1f7a4d] text-white flex items-center justify-center font-bold text-xs mb-1">
                      1
                    </div>
                    <span className="font-semibold text-zinc-800">1. Reported</span>
                    <span className="text-[10px] text-zinc-400">Citizen submitted</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                        activeReport.status !== "Pending Agency Review"
                          ? "bg-[#1f7a4d] text-white"
                          : "bg-[#123321] text-white"
                      }`}
                    >
                      2
                    </div>
                    <span className="font-semibold text-zinc-800">2. Agency Review</span>
                    <span className="text-[10px] text-zinc-400">Admin triaging</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                        activeReport.status === "Collector Assigned" || activeReport.status === "In-Progress"
                          ? "bg-[#1f7a4d] text-white"
                          : activeReport.status === "Resolved"
                          ? "bg-[#123321] text-white"
                          : "bg-zinc-200 text-zinc-500"
                      }`}
                    >
                      3
                    </div>
                    <span className="font-semibold text-zinc-800">3. Driver En Route</span>
                    <span className="text-[10px] text-zinc-400">
                      {activeReport.assignedCollectorName || "Awaiting assignment"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                        activeReport.status === "Resolved"
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-200 text-zinc-500"
                      }`}
                    >
                      4
                    </div>
                    <span className="font-semibold text-zinc-800">4. Resolved</span>
                    <span className="text-[10px] text-zinc-400">Site cleared</span>
                  </div>
                </div>
              </div>

              {/* Collector Details Strip if Assigned */}
              {activeReport.assignedCollectorName && (
                <div className="mt-4 bg-[#eaf3ec] rounded-xl p-3 border border-[#1f7a4d]/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#123321] text-white flex items-center justify-center font-bold text-xs">
                      {activeReport.assignedCollectorName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-900">
                        {activeReport.assignedCollectorName}
                      </span>
                      <span className="text-[11px] text-zinc-600 ml-2">
                        {activeReport.assignedCollectorUnit || "Assigned Unit"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-200">
                    {activeReport.status === "In-Progress"
                      ? "Active On Site • Clean-up In Progress"
                      : activeReport.status === "Collector Assigned"
                      ? "Assigned Driver • Dispatched to Site"
                      : activeReport.status === "Resolved"
                      ? "Completed • Site Verified"
                      : "Unit Assigned"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-8 shadow-xs text-center">
              <div className="max-w-md mx-auto">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#eaf3ec] text-[#123321] mb-2.5">
                  Live Dispatch Tracker
                </span>
                <h3 className="font-heading text-lg font-bold text-zinc-900">
                  No Active Reports in Dispatch
                </h3>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  You have no incidents currently being tracked. Submit a waste or flood report using the buttons above to monitor dispatch and resolution live.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#1f7a4d] text-white text-xs font-semibold hover:bg-[#123321] transition-colors cursor-pointer shadow-xs"
                  >
                    Report Waste
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab("flood")}
                    className="px-4 py-2 rounded-xl bg-[#123321] text-white text-xs font-semibold hover:bg-[#0e1310] transition-colors cursor-pointer border border-[#123321]"
                  >
                    Report Flood to Govt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter & Table of Reports */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-base font-bold text-zinc-900">
                  Incident History & Reports
                </h3>
                <p className="text-xs text-zinc-500">
                  Live waste & flood incident records from the database
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filter === "all" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  All ({reports.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("mine")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filter === "mine" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  My Reports ({myReportsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("active")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filter === "active" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Active ({pendingCount + inProgressCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("resolved")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filter === "resolved" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Resolved ({resolvedCount})
                </button>
              </div>
            </div>

            {/* Reports List */}
            <div className="divide-y divide-zinc-100">
              {filteredReports.map((report) => {
                const isSelected = activeReport?.id === report.id;
                return (
                  <div
                    key={report.id}
                    onClick={() => {
                      setSelectedReportId(report.id);
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className={`p-4 sm:p-5 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-[#eaf3ec]/70 border-l-4 border-[#1f7a4d]"
                        : "hover:bg-zinc-50/80"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {report.image && report.image.startsWith("data:") && (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-zinc-200 bg-zinc-50">
                          <Image src={report.image} alt={report.title} fill className="object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-zinc-500">
                            {report.id}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                              report.category === "Flood & Drainage" || report.isFloodReport
                                ? "bg-[#eaf3ec] text-[#123321] font-semibold border border-[#1f7a4d]/20"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {report.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              report.urgency === "Critical"
                                ? "bg-[#0e1310] text-white"
                                : report.urgency === "High"
                                ? "bg-[#123321] text-white"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {report.urgency}
                          </span>
                          {report.isMyReport && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#123321] text-white">
                              My Report
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1f7a4d] text-white">
                              Live Tracked
                            </span>
                          )}
                        </div>
                        <h4 className="font-heading text-sm font-bold text-zinc-900 mt-1">
                          {report.title}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {report.location} • Handled by:{" "}
                          <strong className="text-zinc-700">{report.agencyName}</strong>
                        </p>
                        {report.isFloodReport && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="bg-[#eaf3ec] text-[#123321] font-semibold px-2 py-0.5 rounded border border-[#1f7a4d]/25">
                              Depth: {report.floodDepth || "Knee-Deep"}
                            </span>
                            {report.drainageBlockage && (
                              <span className="bg-zinc-100 text-zinc-800 font-medium px-2 py-0.5 rounded border border-zinc-200">
                                Blockage: {report.drainageBlockage}
                              </span>
                            )}
                            <span className="bg-[#eaf3ec] text-[#123321] font-medium px-2 py-0.5 rounded border border-[#1f7a4d]/25">
                              Dispatch: {report.governmentAgencyDispatched || "State EFAG Drainage Unit"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            report.status === "Resolved"
                              ? "bg-[#eaf3ec] text-[#123321] border border-[#1f7a4d]/30"
                              : report.status === "Pending Agency Review"
                              ? "bg-zinc-100 text-zinc-800"
                              : "bg-[#123321] text-white"
                          }`}
                        >
                          {report.status}
                        </span>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{report.timeAgo}</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredReports.length === 0 && (
                <div className="p-12 text-center text-sm text-zinc-500">
                  <div className="font-semibold text-zinc-700">No incident reports recorded</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    {filter === "mine"
                      ? "You have not submitted any reports yet under this account."
                      : "No reports match this filter in the live database."}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: CITIZEN FLOOD EMERGENCY TO GOVERNMENT ================= */}
      {currentTab === "flood" && (
        <div className="space-y-6">
          {/* Emergency Alert Toast */}
          {floodSuccessToast && (
            <div className="p-4 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-between shadow-lg">
              <div>
                <div className="font-bold">Emergency Alert Transmitted</div>
                <div className="text-xs text-emerald-100">{floodSuccessToast}</div>
              </div>
              <button
                type="button"
                onClick={() => setFloodSuccessToast(null)}
                className="text-white hover:text-emerald-200 text-sm font-bold"
              >
                Close
              </button>
            </div>
          )}

          {/* Government Emergency Hotline Banner */}
          <div className="rounded-2xl bg-[#123321] p-6 text-white shadow-md relative overflow-hidden border border-[#1f7a4d]/30">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#1f7a4d]/40 border border-white/20 px-3 py-1 text-xs font-semibold text-[#eaf3ec] uppercase tracking-wider mb-2">
                  Government Emergency Flood Portal
                </div>
                <h3 className="font-heading text-xl sm:text-2xl font-bold">
                  Report Street Floods & Clogged Canals to Government
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#eaf3ec]/85 leading-relaxed">
                  Citizens in any location can immediately notify the State Ministry of the Environment & Water
                  Resources and the Emergency Flood Abatement Gang (EFAG). Photo evidence is completely optional for emergency speed.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-[#eaf3ec] tracking-wider">
                    Emergency Toll-Free
                  </div>
                  <div className="text-xl font-bold text-white tracking-widest font-mono">
                    767 / 112
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-[#eaf3ec] tracking-wider">
                    EFAG Drainage Hotline
                  </div>
                  <div className="text-xl font-bold text-white tracking-widest font-mono">
                    +234 1 767-FLOOD
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form & Response Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Flood Incident Form */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
                <div>
                  <h4 className="font-heading text-lg font-bold text-zinc-900">
                    Submit Flood & Drainage Alert
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Fields marked (Optional) do not delay your report. We prioritize fast response.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUseGps}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#eaf3ec] hover:bg-[#eaf3ec]/80 text-[#123321] text-xs font-semibold border border-[#1f7a4d]/25 transition-colors cursor-pointer"
                >
                  <span>Auto-Fill My GPS</span>
                </button>
              </div>

              <form onSubmit={handleCreateFloodReport} className="space-y-5">
                {/* 1. Location, State & LGA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                      1. State *
                    </label>
                    <select
                      value={floodState}
                      onChange={(e) => setFloodState(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none font-semibold"
                    >
                      {NIGERIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                      2. Street Location / Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      value={floodStreet}
                      onChange={(e) => setFloodStreet(e.target.value)}
                      placeholder="e.g. Fajuyi Park or Ozumba Mbadiwe"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                      3. Local Govt Area / Town
                    </label>
                    <input
                      type="text"
                      value={floodLga}
                      onChange={(e) => setFloodLga(e.target.value)}
                      placeholder="e.g. Ado-Ekiti, Ikere, Ikeja"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. Flood Water Depth */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                    3. Estimated Water Depth Level *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { level: "Ankle-Deep", label: "Ankle-Deep", desc: "Pooling on sidewalk" },
                      { level: "Knee-Deep", label: "Knee-Deep", desc: "Roadway inundated" },
                      { level: "Waist-Deep (Severe)", label: "Waist-Deep", desc: "Entering properties" },
                      { level: "Submerged Infrastructure", label: "Critical", desc: "Canal breach / trap" },
                    ].map((item) => (
                      <button
                        key={item.level}
                        type="button"
                        onClick={() => setFloodDepth(item.level as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          floodDepth === item.level
                            ? "border-[#1f7a4d] bg-[#eaf3ec] ring-2 ring-[#1f7a4d] text-[#123321]"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Drainage Blockage Cause */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                      4. Suspected Drainage Cause *
                    </label>
                    <select
                      value={drainageCause}
                      onChange={(e) => setDrainageCause(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                    >
                      <option value="Plastic & Waste Blockage in Storm Canal">
                        Plastic & Refuse Blockage in Storm Canal
                      </option>
                      <option value="Clogged Roadside Culvert & Drain Grates">
                        Clogged Roadside Culvert & Drain Grates
                      </option>
                      <option value="Silted Gutter & Sand Accumulation">
                        Silted Gutter & Sand Accumulation
                      </option>
                      <option value="Broken / Collapsed Drainage Channel">
                        Broken / Collapsed Drainage Channel
                      </option>
                      <option value="Torrential Rain Flash Runoff Overflow">
                        Torrential Rain Flash Runoff Overflow
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                      5. Government Agency to Alert *
                    </label>
                    <select
                      value={floodAgencyId}
                      onChange={(e) => setFloodAgencyId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                    >
                      {agencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>
                          {agency.name} ({agency.district})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Affected Area Description */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                    6. Infrastructure Impact Summary
                  </label>
                  <input
                    type="text"
                    value={affectedInfra}
                    onChange={(e) => setAffectedInfra(e.target.value)}
                    placeholder="e.g. Two-lane traffic halted, residential compound gate submerged"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                  />
                </div>

                {/* 5. Photo Evidence - EXPLICITLY OPTIONAL */}
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                      7. Photo Evidence <span className="text-[#1f7a4d] font-bold lowercase">(optional)</span>
                    </label>
                    {floodPhoto && (
                      <button
                        type="button"
                        onClick={() => setFloodPhoto("")}
                        className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-3">
                    In emergency flood situations, do not delay. You can submit immediately without attaching photos.
                  </p>

                  {floodPhoto ? (
                    <div className="rounded-xl border border-zinc-200 bg-white p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 shrink-0">
                          <Image src={floodPhoto} alt="Flood evidence" fill className="object-cover" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-900 block">Photo Attached</span>
                          <span className="text-[11px] text-zinc-500">Ready to transmit with emergency report</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFloodPhoto("")}
                        className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-red-50 text-zinc-700 hover:text-red-700 text-xs font-semibold cursor-pointer border border-zinc-200"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-300 hover:border-[#1f7a4d] rounded-xl bg-white hover:bg-[#eaf3ec]/30 cursor-pointer transition-colors text-center">
                      <span className="text-xs font-semibold text-zinc-700">Click to upload photo from your device (optional)</span>
                      <span className="text-[11px] text-zinc-400 mt-1">PNG, JPG, or WEBP photo from camera or files</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setFloodPhoto(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={floodIsSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#123321] hover:bg-[#0e1310] text-white text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 border border-[#123321]"
                  >
                    <span>
                      {floodIsSubmitting
                        ? "Transmitting to Government..."
                        : "Transmit Flood Alert to Government"}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right 4 Cols: Government Emergency Workflow & Dispatch Info */}
            <div className="lg:col-span-4 space-y-5">
              {/* How Govt Responds */}
              <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs">
                <h4 className="font-heading text-base font-bold text-zinc-900">
                  Government Action Protocol
                </h4>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  When a citizen files a flood alert on GreenLoop, the report bypasses routine queues:
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#123321] text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
                      1
                    </span>
                    <div>
                      <strong className="text-zinc-900">Immediate Geocode Triage:</strong>
                      <p className="text-zinc-600 mt-0.5">
                        Alert is mapped to the catchment basin and drainage culvert grid.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#123321] text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
                      2
                    </span>
                    <div>
                      <strong className="text-zinc-900">EFAG Crew Dispatch:</strong>
                      <p className="text-zinc-600 mt-0.5">
                        Emergency Flood Abatement Gang deploys to clear waste and sand traps.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#123321] text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
                      3
                    </span>
                    <div>
                      <strong className="text-zinc-900">High-Capacity Dewatering:</strong>
                      <p className="text-zinc-600 mt-0.5">
                        Mobile pumps deployed if water depth exceeds knee level.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#1f7a4d] text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
                      4
                    </span>
                    <div>
                      <strong className="text-zinc-900">Citizen Notification:</strong>
                      <p className="text-zinc-600 mt-0.5">
                        Resident receives status update when canal flow is restored.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsible Entities */}
              <div className="bg-[#eaf3ec] rounded-2xl p-6 border border-[#1f7a4d]/20">
                <h4 className="font-heading text-sm font-bold text-[#123321]">
                  Authorized Government Partners
                </h4>
                <div className="mt-3 space-y-2 text-xs text-[#123321]/90">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1f7a4d]/10">
                    <span>Lagos State Min. of Environment</span>
                    <strong className="text-zinc-900">Drainage Dept</strong>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#1f7a4d]/10">
                    <span>Emergency Flood Abatement Gang</span>
                    <strong className="text-zinc-900">EFAG</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lagos State Emergency Mgmt</span>
                    <strong className="text-zinc-900">LASEMA</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: WASTE AGENCIES DIRECTORY ================= */}
      {currentTab === "agencies" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs">
            <h3 className="font-heading text-lg font-bold text-zinc-900">
              Registered Waste Agencies & PSP Operators
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              GreenLoop connects citizens directly with both municipal authorities and authorized private PSP waste operators. When submitting an incident report, you choose the operator assigned to your street or corridor.
            </p>
          </div>

          {agencies.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200/80">
              <p className="text-sm font-semibold text-zinc-800">No registered waste agencies found.</p>
              <p className="text-xs text-zinc-500 mt-1">Only verified registered agencies in the database are listed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {agencies.map((agency) => (
                <div
                  key={agency.id}
                  className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-[#eaf3ec] text-[#1f7a4d] font-semibold">
                        {agency.type}
                      </span>
                      <span className="font-mono text-zinc-500 font-semibold text-[11px] bg-zinc-100 px-2 py-0.5 rounded-md">
                        {agency.code || "Registered"}
                      </span>
                    </div>
                    <h4 className="font-heading text-base font-bold text-zinc-900">{agency.name}</h4>
                    <p className="text-xs text-zinc-600 mt-1">{agency.district}</p>

                    <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-zinc-600">
                        <span>Weekly Schedule:</span>
                        <strong className="text-zinc-900">{agency.weeklyPickupDays || "Weekly Collections"}</strong>
                      </div>
                      <div className="flex items-center justify-between text-zinc-600">
                        <span>Dispatch Phone:</span>
                        <strong className="text-emerald-700">{agency.phone || "On File"}</strong>
                      </div>
                      <div className="flex items-center justify-between text-zinc-600">
                        <span>Operations Email:</span>
                        <span className="text-zinc-700 font-mono text-[11px]">{agency.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAgencyId(agency.id);
                        setIsModalOpen(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-[#1f7a4d] hover:text-white text-zinc-800 text-xs font-semibold transition-colors cursor-pointer text-center"
                    >
                      Submit Report to This Agency
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: SPECIAL BULKY PICKUP ================= */}
      {currentTab === "bulky" && (
        <div className="max-w-2xl bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs">
          <div className="mb-6">
            <h3 className="font-heading text-lg font-bold text-zinc-900">
              Request Bulky or Off-Schedule Pickup
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Have commercial waste, discarded furniture, tree branches, or electronic equipment? Book a dedicated municipal collection truck directly with your agency.
            </p>
          </div>

          {bulkySuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold text-center">
              Bulky pickup scheduled! Routed to the selected agency dispatch in the database.
            </div>
          )}

          <form onSubmit={handleBulkySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Waste Operator / Agency
              </label>
              <select
                value={bulkyAgencyId}
                onChange={(e) => setBulkyAgencyId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
              >
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.district})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Type of Bulky Waste
              </label>
              <select
                value={bulkyWasteType}
                onChange={(e) => setBulkyWasteType(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
              >
                <option value="Discarded Furniture / Mattresses">Discarded Furniture / Mattresses</option>
                <option value="Commercial Wood / Construction Debris">
                  Commercial Wood / Construction Debris
                </option>
                <option value="Large E-Waste / Appliances (Fridges, TVs)">
                  Large E-Waste / Appliances (Fridges, TVs)
                </option>
                <option value="Garden & Landscaping Cuttings">Garden & Landscaping Cuttings</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Pickup Address
              </label>
              <input
                type="text"
                required
                value={bulkyAddress}
                onChange={(e) => setBulkyAddress(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Requested Collection Date
              </label>
              <input
                type="date"
                required
                value={bulkyDate}
                onChange={(e) => setBulkyDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={bulkyIsSubmitting}
                className="w-full py-3 px-5 rounded-xl bg-[#1f7a4d] hover:bg-[#123321] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {bulkyIsSubmitting ? "Booking..." : "Submit Bulky Pickup Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: REPORT WASTE ISSUE (WITH AGENCY SELECTOR) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-zinc-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="font-heading text-lg font-bold text-zinc-900">
                  Report Waste Incident
                </h3>
                <p className="text-xs text-zinc-500">
                  Select your operator and provide details for rapid dispatch
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-600 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="mt-5 space-y-4">
              {/* 1. AGENCY SELECTOR */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                  1. Designated Waste Agency / PSP Operator
                </label>
                <select
                  value={selectedAgencyId}
                  onChange={(e) => setSelectedAgencyId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                >
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name} — {agency.district}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Report routes directly to this agency’s admin dispatch queue.
                </span>
              </div>

              {/* 2. TITLE */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                  2. Short Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Overflowing garbage bin on street corner"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                />
              </div>

              {/* 3. LOCATION & STATE */}
              <div className="space-y-3 bg-zinc-50/80 p-4 rounded-xl border border-zinc-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                    3. Location & State *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseGpsForWasteReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors cursor-pointer"
                  >
                    <span>📍 Auto-Tag My GPS</span>
                  </button>
                </div>

                {newGpsCoords && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center justify-between">
                    <span className="font-mono font-medium">🎯 Exact GPS: {newGpsCoords}</span>
                    <button
                      type="button"
                      onClick={() => setNewGpsCoords("")}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      State *
                    </label>
                    <select
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                    >
                      {NIGERIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      City / LGA / Town (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ado-Ekiti, Ikere, Victoria Island"
                      value={newCityLga}
                      onChange={(e) => setNewCityLga(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Street Address / Specific Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 14 Fajuyi Road, Near Central Post Office"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  Selecting your State ensures collection truck drivers receive precise Google Maps turn-by-turn directions without misrouting to another state.
                </p>
              </div>

              {/* 4. WASTE CATEGORY */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                  4. Incident Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(["General", "Recyclable", "Organic", "Hazardous", "Flood & Drainage"] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewCategory(cat)}
                        className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                          newCategory === cat
                            ? "border-[#1f7a4d] bg-[#eaf3ec] text-[#123321] ring-1 ring-[#1f7a4d]"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* 5. URGENCY */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                  5. Urgency Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Normal", "High", "Critical"] as const).map((urg) => (
                    <button
                      key={urg}
                      type="button"
                      onClick={() => setNewUrgency(urg)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                        newUrgency === urg
                          ? urg === "Critical"
                            ? "border-[#0e1310] bg-[#0e1310] text-white"
                            : "border-[#1f7a4d] bg-[#123321] text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                      }`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo preview selection - EXPLICITLY OPTIONAL */}
              <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    6. Attach Photo Evidence <span className="text-[#1f7a4d] font-bold lowercase">(optional)</span>
                  </label>
                  {selectedPhoto && (
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto("")}
                      className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {selectedPhoto ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 shrink-0">
                        <Image src={selectedPhoto} alt="Waste evidence" fill className="object-cover" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-900 block">Photo Attached</span>
                        <span className="text-[11px] text-zinc-500">Ready to submit with report</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto("")}
                      className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-red-50 text-zinc-700 hover:text-red-700 text-xs font-semibold cursor-pointer border border-zinc-200"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-300 hover:border-[#1f7a4d] rounded-xl bg-white hover:bg-[#eaf3ec]/30 cursor-pointer transition-colors text-center">
                    <span className="text-xs font-semibold text-zinc-700">Click to upload photo from your device (optional)</span>
                    <span className="text-[11px] text-zinc-400 mt-1">PNG, JPG, or WEBP photo from camera or files</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setSelectedPhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-xl bg-[#1f7a4d] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#123321] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? "Routing to Agency..." : "Submit Incident Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
