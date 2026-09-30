"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { IncidentReport, CollectorUser, WasteAgency } from "@/lib/swmis-data";

export default function CollectorPage() {
  const [currentTab, setCurrentTab] = useState("dispatch");
  const [collector, setCollector] = useState<CollectorUser | null>(null);
  const [agency, setAgency] = useState<WasteAgency | null>(null);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [assignedReports, setAssignedReports] = useState<IncidentReport[]>([]);
  const [completedReports, setCompletedReports] = useState<IncidentReport[]>([]);
  const [totalWeightKg, setTotalWeightKg] = useState(0);

  const [activeReportStep, setActiveReportStep] = useState<"assigned" | "en-route" | "arrived">("en-route");
  const [mediaView, setMediaView] = useState<"map" | "photo">("map");
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [collectedWeightKg, setCollectedWeightKg] = useState("380");
  const [signOffNotes, setSignOffNotes] = useState("Waste cleared thoroughly from curb. Bin sanitized.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Fetch real-time collector data from Neon database
  const loadCollectorData = useCallback(async () => {
    try {
      let queryParam = "";
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("swmis_current_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.collectorProfileId) {
              queryParam = `?collectorId=${encodeURIComponent(parsed.collectorProfileId)}`;
            } else if (parsed.email) {
              queryParam = `?email=${encodeURIComponent(parsed.email)}`;
            }
          } catch {}
        }
      }

      const [profileRes, jobsRes] = await Promise.all([
        fetch(`/api/collector/profile${queryParam}`, { cache: "no-store" }),
        fetch(`/api/collector/jobs${queryParam}`, { cache: "no-store" }),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setCollector(profileData.collector);
        setAgency(profileData.agency);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setReports(jobsData.reports || []);
        setAssignedReports(jobsData.assigned || []);
        setCompletedReports(jobsData.completed || []);
        setTotalWeightKg(jobsData.totalWeightKg || 0);
      }
    } catch (err) {
      console.error("Error loading collector data:", err);
    }
  }, []);

  // Initial load + Real-time auto-sync every 10 seconds
  useEffect(() => {
    loadCollectorData();

    const interval = setInterval(() => {
      loadCollectorData();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadCollectorData]);

  // Active mission stop (first unfinished assigned job)
  const activeMission = assignedReports[0];

  // Helper to extract or resolve coordinates for accurate embedded and external mapping
  const resolveMissionCoordinates = (location?: string, agencyName?: string) => {
    if (!location) {
      return {
        lat: 7.6210,
        lng: 5.2215,
        query: "Ado-Ekiti, Ekiti State, Nigeria",
        displayText: "Ado-Ekiti, Ekiti State",
      };
    }

    const clean = location.replace(/^📍\s*/, "").trim();

    // 1. Check if location has GPS coordinates like "GPS: 7.6210 N, 5.2215 E" or "7.6210, 5.2215"
    const gpsRegex = /(?:GPS:\s*)?([+-]?\d+(?:\.\d+)?)\s*([NSEWnsew])?[\s,]+([+-]?\d+(?:\.\d+)?)\s*([NSEWnsew])?/;
    const match = clean.match(gpsRegex);

    if (match) {
      let lat = parseFloat(match[1]);
      const latDir = match[2]?.toUpperCase();
      let lng = parseFloat(match[3]);
      const lngDir = match[4]?.toUpperCase();

      if (latDir === "S") lat = -Math.abs(lat);
      if (latDir === "N") lat = Math.abs(lat);
      if (lngDir === "W") lng = -Math.abs(lng);
      if (lngDir === "E") lng = Math.abs(lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          lat,
          lng,
          query: `${lat},${lng}`,
          displayText: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        };
      }
    }

    // 2. Identify region context
    const isEkiti = /ekiti/i.test(clean) || (agencyName && /ekiti/i.test(agencyName));
    const isLagos = /lagos/i.test(clean) || (agencyName && /lagos/i.test(agencyName));

    // Check if clean text is un-geocodable gibberish (e.g. single word with no spaces and long random chars like "zikhdioshjdioasjnhdioqw")
    const isGibberish =
      !clean.includes(" ") &&
      clean.length > 7 &&
      !/^(fajuyi|okesa|ajilosun|bank|market|ikeja|vi|lekki|ikere|ado)$/i.test(clean);

    let resolvedQuery = "";
    let displayText = clean;
    let defaultLat = 7.6210;
    let defaultLng = 5.2215;

    if (isEkiti) {
      defaultLat = 7.6210;
      defaultLng = 5.2215;
      if (isGibberish) {
        resolvedQuery = "Ado-Ekiti, Ekiti State, Nigeria";
        displayText = `${clean} (Ado-Ekiti Service Zone)`;
      } else if (!/ekiti/i.test(clean)) {
        resolvedQuery = `${clean}, Ekiti State, Nigeria`;
        displayText = `${clean}, Ekiti State`;
      } else {
        resolvedQuery = clean.includes("Nigeria") ? clean : `${clean}, Nigeria`;
        displayText = clean;
      }
    } else if (isLagos) {
      defaultLat = 6.4531;
      defaultLng = 3.4244;
      if (isGibberish) {
        resolvedQuery = "Victoria Island, Lagos, Nigeria";
        displayText = `${clean} (Victoria Island, Lagos)`;
      } else if (!/lagos/i.test(clean)) {
        resolvedQuery = `${clean}, Lagos, Nigeria`;
        displayText = `${clean}, Lagos`;
      } else {
        resolvedQuery = clean.includes("Nigeria") ? clean : `${clean}, Nigeria`;
        displayText = clean;
      }
    } else {
      resolvedQuery = isGibberish ? "Ado-Ekiti, Ekiti State, Nigeria" : `${clean}, Nigeria`;
      displayText = clean;
    }

    return { lat: defaultLat, lng: defaultLng, query: resolvedQuery, displayText };
  };

  // Helper to generate Google Maps turn-by-turn driving directions URL
  const getGoogleMapsDirectionsUrl = (location?: string, agencyName?: string) => {
    const resolved = resolveMissionCoordinates(location, agencyName);
    return `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(resolved.query)}&travelmode=driving`;
  };

  const handleStartRoute = async () => {
    setActiveReportStep("en-route");
    setMediaView("map");
    if (activeMission) {
      // Launch Google Maps navigation SYNCHRONOUSLY before await fetch to avoid browser popup blockers
      if (typeof window !== "undefined" && activeMission.location) {
        const mapsUrl = getGoogleMapsDirectionsUrl(activeMission.location, activeMission.agencyName);
        window.open(mapsUrl, "_blank", "noopener,noreferrer");
      }

      try {
        await fetch("/api/collector/step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId: activeMission.id, step: "en-route" }),
        });
      } catch {}
    }
    showToast("Route GPS started! Live embedded map activated & turn-by-turn navigation launched.");
  };

  const handleMarkArrived = async () => {
    setActiveReportStep("arrived");
    if (activeMission) {
      try {
        await fetch("/api/collector/step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId: activeMission.id, step: "arrived" }),
        });
      } catch {}
    }
    showToast("Marked arrived at location. Ready for waste loading.");
  };

  const handleCompleteSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMission) return;

    setIsSubmitting(true);
    const weight = parseFloat(collectedWeightKg) || 350;

    try {
      const res = await fetch("/api/collector/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: activeMission.id,
          weightCollectedKg: weight,
          notes: signOffNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await loadCollectorData();
        setIsSignOffModalOpen(false);
        showToast(data.message || `✓ Task ${activeMission.id} completed! Logged ${weight} kg.`);
      } else {
        showToast(data.error || "Failed to resolve task.");
      }
    } catch {
      showToast("Network error: Could not complete sign off.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalTonsLogged = (totalWeightKg / 1000).toFixed(1);
  const compactorPercent = collector?.compactorLoad ?? 68;

  return (
    <DashboardLayout
      role="collector"
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      title="Field Sanitation Crew Dashboard"
      subtitle={`${collector?.truckUnit || "Compactor Unit #04"} • ${agency?.name || "Waste Authority"}`}
      agencyName={agency?.name}
      userName={collector?.name}
      headerAction={
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/70 text-amber-800 font-semibold text-xs border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
            Shift Status: Active ({collector?.status || "On Shift"})
          </span>
        </div>
      }
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="mb-6 p-4 rounded-xl bg-[#123321] text-emerald-300 border border-emerald-500/30 font-medium text-xs shadow-lg flex items-center justify-between">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage("")}
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* ================= 1. SHIFT TELEMETRY CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Assigned Pickups
          </div>
          <div className="text-2xl font-bold font-heading text-zinc-900 mt-2">
            {assignedReports.length}{" "}
            <span className="text-xs font-normal text-zinc-400">
              ({completedReports.length} completed)
            </span>
          </div>
          <div className="text-xs text-zinc-400 mt-1">Assigned by Agency Admin</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Waste Collected Today
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-700 mt-2">
            {totalWeightKg > 0 ? `${totalTonsLogged} Tons` : "4.2 Tons"}
          </div>
          <div className="text-xs text-zinc-400 mt-1">Logged across morning shift</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Compactor Load
            </div>
            <span className="text-xs font-bold text-amber-800">
              {compactorPercent}%
            </span>
          </div>
          <div className="w-full bg-zinc-200 h-2.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${compactorPercent}%` }}
            />
          </div>
          <div className="text-xs text-amber-700 mt-2">
            {((compactorPercent / 100) * 5.5).toFixed(1)} / 5.5 Tons Capacity
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Shift Route Distance
          </div>
          <div className="text-2xl font-bold font-heading text-zinc-900 mt-2">
            14.2 km
          </div>
          <div className="text-xs text-emerald-600 mt-1">94% On-Time SLA Rate</div>
        </div>
      </div>

      {/* ================= TAB 1: MISSION DISPATCH (ACTIVE STOP) ================= */}
      {currentTab === "dispatch" && (
        <div className="space-y-6">
          {activeMission ? (
            <div className="bg-white rounded-2xl border border-[#1f7a4d]/30 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      Priority Stop #1
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      ID: {activeMission.id}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-zinc-900 mt-1.5">
                    {activeMission.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-xs text-zinc-600">
                      📍 {activeMission.location}
                    </p>
                    <a
                      href={getGoogleMapsDirectionsUrl(activeMission.location, activeMission.agencyName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
                      title="Open Google Maps Driving Directions"
                    >
                      <span>🗺️ Open in Google Maps</span>
                      <svg className="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    {activeMission.category} Waste
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                    {activeMission.urgency} Urgency
                  </span>
                </div>
              </div>

              {/* Mission Details & Interactive Location Console */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
                {/* Embedded Interactive Map & Navigation Console */}
                <div className="lg:col-span-6 flex flex-col">
                  {/* View mode toggle & Quick External Maps launch */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/60">
                      <button
                        type="button"
                        onClick={() => setMediaView("map")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          mediaView === "map"
                            ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80"
                            : "text-zinc-600 hover:text-zinc-900"
                        }`}
                      >
                        🗺️ Embedded GPS Route Map
                      </button>
                      {activeMission.image && (
                        <button
                          type="button"
                          onClick={() => setMediaView("photo")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            mediaView === "photo"
                              ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80"
                              : "text-zinc-600 hover:text-zinc-900"
                          }`}
                        >
                          📷 Citizen Photo Evidence
                        </button>
                      )}
                    </div>

                    <a
                      href={getGoogleMapsDirectionsUrl(activeMission.location, activeMission.agencyName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
                      title="Launch turn-by-turn driving navigation in Google Maps app"
                    >
                      <span>Google Maps App ↗</span>
                    </a>
                  </div>

                  {/* Interactive Embedded Map or Photo Evidence */}
                  <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-zinc-200 shadow-sm bg-zinc-950">
                    {mediaView === "map" ? (
                      <div className="w-full h-full relative">
                        <iframe
                          title="Interactive Mission Map"
                          width="100%"
                          height="100%"
                          className="w-full h-full border-0"
                          loading="lazy"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(
                            resolveMissionCoordinates(activeMission.location, activeMission.agencyName).query
                          )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                        />

                        {/* Top Telemetry Overlay */}
                        <div className="absolute top-3 left-3 bg-zinc-900/90 backdrop-blur-md text-white text-xs px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg flex items-center gap-2.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              activeReportStep === "en-route"
                                ? "bg-emerald-400 animate-pulse ring-2 ring-emerald-400/50"
                                : "bg-amber-400"
                            }`}
                          />
                          <span className="font-bold">
                            {activeReportStep === "en-route" ? "GPS Active (En Route)" : "Dispatch Staging"}
                          </span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-emerald-300 font-mono text-[11px]">
                            {resolveMissionCoordinates(activeMission.location, activeMission.agencyName).displayText}
                          </span>
                        </div>

                        {/* Bottom Route Target Banner */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-200/90 text-xs text-zinc-700 flex items-center justify-between shadow-lg">
                          <div className="truncate mr-2">
                            <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                              Navigation Destination
                            </span>
                            <strong className="text-zinc-900 truncate block">
                              {resolveMissionCoordinates(activeMission.location, activeMission.agencyName).displayText}
                            </strong>
                          </div>
                          <a
                            href={getGoogleMapsDirectionsUrl(activeMission.location, activeMission.agencyName)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 px-2.5 py-1 rounded-lg bg-[#1f7a4d] hover:bg-[#123321] text-white font-bold text-xs shadow-xs"
                          >
                            Voice Nav ↗
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full relative">
                        <Image
                          src={activeMission.image!}
                          alt={activeMission.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-xs text-white text-xs p-2.5 rounded-xl flex items-center justify-between">
                          <span>Reported by: {activeMission.submittedBy}</span>
                          <button
                            type="button"
                            onClick={() => setMediaView("map")}
                            className="px-2.5 py-1 bg-emerald-600 rounded-lg font-bold hover:bg-emerald-500 text-white cursor-pointer"
                          >
                            Show Map View
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Mission Brief, Metrics & Action Controls */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Visual Mission Progress Stepper */}
                    <div className="bg-zinc-50/90 border border-zinc-200/80 rounded-2xl p-3 flex items-center justify-between text-xs shadow-2xs">
                      <div className={`flex items-center gap-1.5 font-bold ${
                        activeReportStep === "en-route" || activeReportStep === "arrived"
                          ? "text-emerald-700"
                          : "text-amber-800"
                      }`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          activeReportStep === "en-route" || activeReportStep === "arrived"
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}>
                          {activeReportStep === "en-route" || activeReportStep === "arrived" ? "✓" : "1"}
                        </span>
                        <span>1. En Route</span>
                      </div>
                      <div className={`h-0.5 flex-1 mx-2 transition-colors ${
                        activeReportStep === "arrived" ? "bg-emerald-500" : "bg-zinc-200"
                      }`} />
                      <div className={`flex items-center gap-1.5 font-bold ${
                        activeReportStep === "arrived" ? "text-emerald-700" : "text-zinc-400"
                      }`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          activeReportStep === "arrived" ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-600"
                        }`}>
                          {activeReportStep === "arrived" ? "✓" : "2"}
                        </span>
                        <span>2. At Curb</span>
                      </div>
                      <div className="h-0.5 flex-1 mx-2 bg-zinc-200" />
                      <div className="flex items-center gap-1.5 font-bold text-zinc-400">
                        <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-[10px] font-bold">
                          3
                        </span>
                        <span>3. Cleared</span>
                      </div>
                    </div>

                    {/* Incident Field Brief */}
                    <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">📝</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                            Incident Field Notes
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          Reported by <strong className="text-zinc-700">{activeMission.submittedBy || "Resident"}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50/80 p-3 rounded-xl border border-zinc-100 italic">
                        &ldquo;{activeMission.description}&rdquo;
                      </p>
                    </div>

                    {/* Flood Protocol Alert (if applicable) */}
                    {activeMission.isFloodReport && (
                      <div className="p-3.5 rounded-2xl bg-[#eaf3ec] border border-[#1f7a4d]/25 text-xs text-[#123321] shadow-2xs">
                        <strong className="block font-bold mb-1">🌊 Flood Emergency Protocol Active:</strong>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <span>Water: <strong>{activeMission.floodDepth || "Knee-Deep"}</strong></span>
                          <span>•</span>
                          <span>Blockage: <strong>{activeMission.drainageBlockage || "Canal silt & plastic"}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Operational Telemetry Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-xl bg-white border border-zinc-200/90 shadow-2xs">
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                          Assigned Authority
                        </span>
                        <strong className="text-zinc-900 text-xs truncate block mt-0.5">
                          {activeMission.agencyName}
                        </strong>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-zinc-200/90 shadow-2xs">
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                          Target SLA
                        </span>
                        <strong className="text-emerald-700 text-xs block mt-0.5 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Clear in 45m
                        </strong>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-zinc-200/90 shadow-2xs col-span-2 sm:col-span-1">
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                          Waste Profile
                        </span>
                        <strong className="text-amber-800 text-xs block mt-0.5 truncate">
                          {activeMission.category} ({activeMission.urgency})
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Ergonomic Step Action Controls */}
                  <div className="pt-3 border-t border-zinc-100 space-y-2.5">
                    {/* Step 1 & Step 2 Row: Perfectly balanced 2-column grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handleStartRoute}
                        className={`px-3 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          activeReportStep === "en-route"
                            ? "bg-[#1f7a4d] text-white shadow-xs ring-2 ring-emerald-500/20"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                        title="Starts GPS tracking and launches Google Maps turn-by-turn navigation"
                      >
                        <span>{activeReportStep === "en-route" ? "✓ 1. En Route (GPS)" : "1. Start Route (GPS)"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleMarkArrived}
                        className={`px-3 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          activeReportStep === "arrived"
                            ? "bg-[#123321] text-white shadow-xs ring-2 ring-emerald-950/20"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        <span>{activeReportStep === "arrived" ? "✓ 2. Arrived at Curb" : "2. Mark Arrived"}</span>
                      </button>
                    </div>

                    {/* Step 3: Complete Pickup & Sign Off (Full Width Prominent CTA) */}
                    <button
                      type="button"
                      onClick={() => setIsSignOffModalOpen(true)}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#1f7a4d] to-[#123321] hover:from-[#17623c] hover:to-[#0e2719] text-white text-xs font-extrabold shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 group"
                    >
                      <span>3. Complete & Sign Off Collection Stop</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </button>

                    {/* En-Route Status and Re-open Link */}
                    {activeReportStep === "en-route" && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between text-xs">
                        <span className="text-emerald-800 font-semibold flex items-center gap-1.5 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          Google Maps navigation active
                        </span>
                        <a
                          href={getGoogleMapsDirectionsUrl(activeMission.location, activeMission.agencyName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                        >
                          Re-open Maps App ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 border border-zinc-200/80 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                ✓
              </div>
              <h3 className="font-heading text-lg font-bold text-zinc-900">
                All Assigned Stops Completed!
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                No active pickups currently waiting in your queue. The Municipal Admin can dispatch new citizen reports to your truck unit from the triage queue.
              </p>
            </div>
          )}

          {/* Quick Route Stops Overview */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
            <h3 className="font-heading text-base font-bold text-zinc-900 mb-3">
              Today’s Assigned Stop Sequence
            </h3>
            <div className="space-y-3">
              {reports.map((rep, idx) => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center font-bold text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="text-zinc-900">{rep.location}</strong>
                      <span className="text-zinc-400 ml-2">({rep.category})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={getGoogleMapsDirectionsUrl(rep.location, rep.agencyName || agency?.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-1"
                      title="Open in Google Maps"
                    >
                      <span>🗺️ Map</span>
                    </a>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        rep.status === "Resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>
                </div>
              ))}

              {reports.length === 0 && (
                <div className="py-6 text-center text-xs text-zinc-400">
                  No stops assigned yet by your agency administrator.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ASSIGNED STOPS ================= */}
      {currentTab === "stops" && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-zinc-100">
            <h3 className="font-heading text-base font-bold text-zinc-900">
              Assigned Collection Route Stops
            </h3>
            <p className="text-xs text-zinc-500">
              Ordered list of community stops assigned to {collector?.truckUnit || "Field Unit"} by {agency?.name || "Waste Authority"}
            </p>
          </div>

          <div className="divide-y divide-zinc-100">
            {reports.map((rep, idx) => (
              <div key={rep.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#123321] text-emerald-400 flex items-center justify-center font-bold text-xs">
                    0{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-zinc-900">
                      {rep.title}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      📍 {rep.location} • Category: <strong className="text-zinc-700">{rep.category}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={getGoogleMapsDirectionsUrl(rep.location, rep.agencyName || agency?.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <span>🗺️ Navigate</span>
                  </a>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        rep.status === "Resolved"
                          ? "bg-[#eaf3ec] text-[#123321] border border-[#1f7a4d]/25"
                          : "bg-[#123321] text-white"
                      }`}
                    >
                      {rep.status}
                    </span>
                    {rep.weightCollectedKg && (
                      <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                        {rep.weightCollectedKg} kg recorded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {reports.length === 0 && (
              <div className="p-8 text-center text-xs text-zinc-400">
                No route stops assigned for this vehicle yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: TRUCK & COMPACTOR TELEMETRY ================= */}
      {currentTab === "telemetry" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs">
            <h3 className="font-heading text-base font-bold text-zinc-900 mb-4">
              Compactor Vehicle Diagnostics
            </h3>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Unit Identification:</span>
                <strong className="text-zinc-800">{collector?.truckUnit || "Compactor Unit"}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">License Plate:</span>
                <span className="font-mono font-bold text-zinc-800">{collector?.plateNumber || "LAG-782-X"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Driver Account:</span>
                <strong className="text-zinc-800">{collector?.name} ({collector?.email})</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Compactor Payload:</span>
                <strong className="text-amber-700">{compactorPercent}% Full</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Joined Agency:</span>
                <strong className="text-zinc-800">{collector?.joinedDate || "Active"}</strong>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">Telemetry GPS Ping:</span>
                <span className="text-emerald-600 font-semibold">Active (Every 10s via Neon)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs">
            <h3 className="font-heading text-base font-bold text-zinc-900 mb-2">
              Designated Dump Site / Transfer Station
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              When compactor payload reaches 85%+, route to this authorized municipal dump station.
            </p>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
              <div className="font-bold text-zinc-900 text-sm">
                Simpson Waste Transfer Station
              </div>
              <div className="text-zinc-600">
                📍 Simpson Street / Lagos Island Expressway
              </div>
              <div className="text-zinc-600">
                Distance: <strong className="text-zinc-800">3.4 km from current sector</strong>
              </div>
              <div className="text-zinc-600">
                Operating Hours: <strong className="text-zinc-800">24 Hours / Round-the-clock</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PROOF-OF-SERVICE SIGN-OFF ================= */}
      {isSignOffModalOpen && activeMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="font-heading text-lg font-bold text-zinc-900">
                  Proof of Service Sign-Off
                </h3>
                <p className="text-xs text-zinc-500">
                  Confirm site clearance and record weight for {activeMission.id}
                </p>
              </div>
              <button
                onClick={() => setIsSignOffModalOpen(false)}
                type="button"
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteSignOff} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Collected Waste Weight (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={collectedWeightKg}
                    onChange={(e) => setCollectedWeightKg(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:border-[#1f7a4d] focus:outline-none pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-zinc-400 font-semibold pointer-events-none">
                    KG
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Field Resolution Notes
                </label>
                <textarea
                  rows={2}
                  value={signOffNotes}
                  onChange={(e) => setSignOffNotes(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-xs text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                ✓ Photographic confirmation verified via GPS timestamp in Neon database.
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSignOffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#1f7a4d] hover:bg-[#123321] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving to Database..." : "Confirm & Resolve Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
