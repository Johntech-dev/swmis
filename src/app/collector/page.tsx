"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  IncidentReport,
  CollectorUser,
  WasteAgency,
  getStoredReports,
  saveReports,
  getStoredCollectors,
  getStoredAgencies,
} from "@/lib/swmis-data";

export default function CollectorPage() {
  const [currentTab, setCurrentTab] = useState("dispatch");
  const [collector, setCollector] = useState<CollectorUser | null>(null);
  const [agency, setAgency] = useState<WasteAgency | null>(null);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [activeReportStep, setActiveReportStep] = useState<"assigned" | "en-route" | "arrived">("en-route");
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [collectedWeightKg, setCollectedWeightKg] = useState("380");
  const [signOffNotes, setSignOffNotes] = useState("Waste cleared thoroughly from curb. Bin sanitized.");
  const [toastMessage, setToastMessage] = useState("");

  // Load collector session (defaulting to col-1: Tunde Adeleke)
  useEffect(() => {
    const collectors = getStoredCollectors();
    const current = collectors.find((c) => c.id === "col-1") || collectors[0];
    setCollector(current);

    const agencies = getStoredAgencies();
    const currentAgency = agencies.find((a) => a.id === current.agencyId) || agencies[0];
    setAgency(currentAgency);

    const allReports = getStoredReports();
    setReports(allReports);
  }, []);

  // Filter reports assigned to this collector
  const myAssignedReports = reports.filter(
    (r) => r.assignedCollectorId === collector?.id && r.status !== "Resolved"
  );
  const myResolvedReports = reports.filter(
    (r) => r.assignedCollectorId === collector?.id && r.status === "Resolved"
  );

  // Active mission stop
  const activeMission = myAssignedReports[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleStartRoute = () => {
    setActiveReportStep("en-route");
    showToast("Route GPS started! Citizen notified you are en route.");
  };

  const handleMarkArrived = () => {
    setActiveReportStep("arrived");
    showToast("Marked arrived at location. Ready for waste loading.");
  };

  const handleCompleteSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMission) return;

    const weight = parseFloat(collectedWeightKg) || 350;

    // Update report to Resolved
    const updated = reports.map((r) => {
      if (r.id === activeMission.id) {
        return {
          ...r,
          status: "Resolved" as const,
          weightCollectedKg: weight,
          completedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    setReports(updated);
    saveReports(updated);
    setIsSignOffModalOpen(false);
    showToast(`✓ Task ${activeMission.id} completed! Logged ${weight} kg.`);
  };

  return (
    <DashboardLayout
      role="collector"
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      title="Field Sanitation Crew Dashboard"
      subtitle={`Compactor Unit #04 • ${agency?.name || "Lagos Central Waste Authority"}`}
      agencyName={agency?.name}
      userName={collector?.name}
      headerAction={
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/70 text-amber-800 font-semibold text-xs border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
            Shift Status: Active (Shift 01)
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
            {myAssignedReports.length}{" "}
            <span className="text-xs font-normal text-zinc-400">
              ({myResolvedReports.length} completed)
            </span>
          </div>
          <div className="text-xs text-zinc-400 mt-1">Assigned by Agency Admin</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Waste Collected Today
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-700 mt-2">
            {(4.2 + (myResolvedReports.length > 1 ? 0.38 : 0)).toFixed(1)} Tons
          </div>
          <div className="text-xs text-zinc-400 mt-1">Logged across morning shift</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Compactor Load
            </div>
            <span className="text-xs font-bold text-amber-800">
              {collector?.compactorLoad || 68}%
            </span>
          </div>
          <div className="w-full bg-zinc-200 h-2.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${collector?.compactorLoad || 68}%` }}
            />
          </div>
          <div className="text-xs text-amber-700 mt-2">3.8 / 5.5 Tons Capacity</div>
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
                  <p className="text-xs text-zinc-600 mt-0.5">
                    📍 {activeMission.location}
                  </p>
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

              {/* Mission Details & Location */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6">
                <div className="md:col-span-4 relative h-48 rounded-xl overflow-hidden border border-zinc-200 shadow-inner">
                  <Image
                    src={activeMission.image || "/images/citizen_reporting_bin.jpg"}
                    alt={activeMission.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[11px] p-2 rounded-lg">
                    Reported by: {activeMission.submittedBy}
                  </div>
                </div>

                <div className="md:col-span-8 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/80 text-xs">
                      <span className="font-semibold text-zinc-800 block mb-1">
                        Incident Description:
                      </span>
                      <p className="text-zinc-600 leading-relaxed">
                        {activeMission.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl border border-zinc-200 bg-white">
                        <span className="text-zinc-400 block text-[11px]">Assigned Agency:</span>
                        <strong className="text-zinc-800">{activeMission.agencyName}</strong>
                      </div>
                      <div className="p-3 rounded-xl border border-zinc-200 bg-white">
                        <span className="text-zinc-400 block text-[11px]">Target SLA:</span>
                        <strong className="text-emerald-700">Clear within 45 mins</strong>
                      </div>
                    </div>
                  </div>

                  {/* Step Control Buttons */}
                  <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleStartRoute}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeReportStep === "en-route"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      1. Start Route (GPS)
                    </button>

                    <button
                      type="button"
                      onClick={handleMarkArrived}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeReportStep === "arrived"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      2. Mark Arrived at Curb
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSignOffModalOpen(true)}
                      className="ml-auto px-5 py-2.5 rounded-xl bg-[#1f7a4d] hover:bg-[#123321] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      3. Complete & Sign Off →
                    </button>
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
              ))}
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
              Ordered list of community stops assigned to Compactor Unit #04 by Lagos Central Waste Authority
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

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                      rep.status === "Resolved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
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
            ))}
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
                <strong className="text-zinc-800">Compactor Unit #04 (Mercedes Actros)</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">License Plate:</span>
                <span className="font-mono font-bold text-zinc-800">LAG-782-X</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Hydraulic Compaction Pressure:</span>
                <strong className="text-emerald-700">2,400 PSI (Optimal)</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Fuel Level:</span>
                <strong className="text-zinc-800">74% (Diesel)</strong>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">Telemetry GPS Ping:</span>
                <span className="text-emerald-600 font-semibold">Active (Every 10s)</span>
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
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold"
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
                ✓ Photographic confirmation verified via GPS timestamp.
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
                  className="px-5 py-2 rounded-xl bg-[#1f7a4d] hover:bg-[#123321] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Confirm & Resolve Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
