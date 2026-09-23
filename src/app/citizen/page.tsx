"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  IncidentReport,
  WasteCategory,
  ReportUrgency,
  WasteAgency,
  getStoredReports,
  saveReports,
  getStoredAgencies,
} from "@/lib/swmis-data";

export default function CitizenPage() {
  const [currentTab, setCurrentTab] = useState("tracker");
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [agencies, setAgencies] = useState<WasteAgency[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for new report
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLocation, setNewLocation] = useState("Adeola Street, Victoria Island");
  const [newCategory, setNewCategory] = useState<WasteCategory>("General");
  const [newUrgency, setNewUrgency] = useState<ReportUrgency>("Normal");
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState("/images/citizen_reporting_bin.jpg");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulky pickup form state
  const [bulkyWasteType, setBulkyWasteType] = useState("Discarded Furniture / Mattresses");
  const [bulkyAddress, setBulkyAddress] = useState("Plot 12, Adeola Odeku St, Victoria Island");
  const [bulkyDate, setBulkyDate] = useState("2026-09-26");
  const [bulkyAgencyId, setBulkyAgencyId] = useState("");
  const [bulkySuccess, setBulkySuccess] = useState(false);

  // Load from local storage
  useEffect(() => {
    const loadedAgencies = getStoredAgencies();
    setAgencies(loadedAgencies);
    if (loadedAgencies.length > 0) {
      setSelectedAgencyId(loadedAgencies[0].id);
      setBulkyAgencyId(loadedAgencies[0].id);
    }
    const loadedReports = getStoredReports();
    setReports(loadedReports);
  }, []);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (filter === "active") {
      return r.status === "Pending Agency Review" || r.status === "Collector Assigned" || r.status === "In-Progress";
    }
    if (filter === "resolved") {
      return r.status === "Resolved";
    }
    return true;
  });

  // Calculate statistics
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === "Pending Agency Review").length;
  const inProgressCount = reports.filter((r) => r.status === "Collector Assigned" || r.status === "In-Progress").length;
  const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

  // Active highlighted report for real-time tracking
  const activeReport = reports.find(
    (r) => r.status === "Collector Assigned" || r.status === "In-Progress"
  ) || reports.find((r) => r.status === "Pending Agency Review");

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const agency = agencies.find((a) => a.id === selectedAgencyId) || agencies[0];

    setTimeout(() => {
      const newReport: IncidentReport = {
        id: `REP-${Math.floor(2490 + Math.random() * 80)}`,
        title: newTitle.trim() || "Waste overflow incident reported",
        description: newDescription.trim() || "Incident reported by resident via GreenLoop citizen portal.",
        location: newLocation,
        category: newCategory,
        urgency: newUrgency,
        agencyId: agency.id,
        agencyName: agency.name,
        status: "Pending Agency Review",
        image: selectedPhoto,
        createdAt: new Date().toISOString(),
        timeAgo: "Just now",
        submittedBy: "Amara Okafor",
      };

      const updated = [newReport, ...reports];
      setReports(updated);
      saveReports(updated);

      setIsSubmitting(false);
      setIsModalOpen(false);
      setNewTitle("");
      setNewDescription("");
    }, 500);
  };

  const handleBulkySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const agency = agencies.find((a) => a.id === bulkyAgencyId) || agencies[0];

    const bulkyReport: IncidentReport = {
      id: `BLK-${Math.floor(5100 + Math.random() * 90)}`,
      title: `Special Bulky Collection: ${bulkyWasteType}`,
      description: `Scheduled bulky waste removal requested for ${bulkyDate}.`,
      location: bulkyAddress,
      category: "General",
      urgency: "Normal",
      agencyId: agency.id,
      agencyName: agency.name,
      status: "Pending Agency Review",
      image: "/images/waste_collection_truck.jpg",
      createdAt: new Date().toISOString(),
      timeAgo: "Just now",
      submittedBy: "Amara Okafor",
    };

    const updated = [bulkyReport, ...reports];
    setReports(updated);
    saveReports(updated);

    setBulkySuccess(true);
    setTimeout(() => {
      setBulkySuccess(false);
      setCurrentTab("tracker");
    }, 1500);
  };

  return (
    <DashboardLayout
      role="citizen"
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      title="Citizen Waste Incident Portal"
      subtitle="Report community waste issues and track dispatch resolution with your designated waste operators"
      headerAction={
        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1f7a4d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#123321] transition-all shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Report Waste Issue</span>
        </button>
      }
    >
      {/* ================= 1. NORMAL DASHBOARD METRIC SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Total Reports
          </div>
          <div className="text-2xl font-bold font-heading text-zinc-900 mt-2">
            {totalCount}
          </div>
          <div className="text-xs text-zinc-400 mt-1">Submitted from your area</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            Pending Agency Review
          </div>
          <div className="text-2xl font-bold font-heading text-amber-900 mt-2">
            {pendingCount}
          </div>
          <div className="text-xs text-amber-700/80 mt-1">Awaiting dispatch assignment</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-blue-200/80 bg-blue-50/20 shadow-xs">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Active Dispatches
          </div>
          <div className="text-2xl font-bold font-heading text-blue-900 mt-2">
            {inProgressCount}
          </div>
          <div className="text-xs text-blue-700/80 mt-1">Sanitation crew en route</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Resolved & Cleared
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-900 mt-2">
            {resolvedCount}
          </div>
          <div className="text-xs text-emerald-700/80 mt-1">Verified clean sites</div>
        </div>
      </div>

      {/* ================= TAB 1: INCIDENT TRACKER ================= */}
      {currentTab === "tracker" && (
        <div className="space-y-6">
          {/* Active Live Progress Tracker Card */}
          {activeReport && (
            <div className="bg-white rounded-2xl border border-emerald-500/30 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      Live Dispatch Tracker
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      ID: {activeReport.id}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-zinc-900 mt-1.5">
                    {activeReport.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    📍 {activeReport.location} • Submitted to:{" "}
                    <strong className="text-zinc-700">{activeReport.agencyName}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      activeReport.status === "Resolved"
                        ? "bg-emerald-100 text-emerald-800"
                        : activeReport.status === "Pending Agency Review"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {activeReport.status}
                  </span>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    {activeReport.timeAgo}
                  </div>
                </div>
              </div>

              {/* 4-Step Progress Line */}
              <div className="pt-5 pb-2">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-1">
                      ✓
                    </div>
                    <span className="font-semibold text-zinc-800">1. Reported</span>
                    <span className="text-[10px] text-zinc-400">Citizen submitted</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                        activeReport.status !== "Pending Agency Review"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white animate-pulse"
                      }`}
                    >
                      {activeReport.status !== "Pending Agency Review" ? "✓" : "2"}
                    </div>
                    <span className="font-semibold text-zinc-800">2. Agency Review</span>
                    <span className="text-[10px] text-zinc-400">Admin triaging</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                        activeReport.status === "Collector Assigned" || activeReport.status === "In-Progress"
                          ? "bg-blue-600 text-white"
                          : activeReport.status === "Resolved"
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-200 text-zinc-500"
                      }`}
                    >
                      {activeReport.status === "Resolved" ? "✓" : "3"}
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
                    <div className="w-8 h-8 rounded-lg bg-[#123321] text-emerald-400 flex items-center justify-center font-bold text-xs">
                      TA
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-900">
                        {activeReport.assignedCollectorName}
                      </span>
                      <span className="text-[11px] text-zinc-600 ml-2">
                        {activeReport.assignedCollectorUnit}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-200">
                    En Route • 0.8 km away
                  </span>
                </div>
              )}
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
                  All logged waste reports across selected sanitation agencies
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filter === "all"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  All ({reports.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("active")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filter === "active"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Active ({pendingCount + inProgressCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("resolved")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filter === "resolved"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Resolved ({resolvedCount})
                </button>
              </div>
            </div>

            {/* Reports List */}
            <div className="divide-y divide-zinc-100">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-zinc-200">
                      <Image
                        src={report.image || "/images/citizen_reporting_bin.jpg"}
                        alt={report.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-zinc-500">
                          {report.id}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium">
                          {report.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            report.urgency === "Critical"
                              ? "bg-red-100 text-red-700"
                              : report.urgency === "High"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {report.urgency}
                        </span>
                      </div>
                      <h4 className="font-heading text-sm font-bold text-zinc-900 mt-1">
                        {report.title}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        📍 {report.location} • Handled by:{" "}
                        <strong className="text-zinc-700">{report.agencyName}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          report.status === "Resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : report.status === "Pending Agency Review"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {report.status}
                      </span>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {report.timeAgo}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredReports.length === 0 && (
                <div className="p-8 text-center text-sm text-zinc-500">
                  No incident reports match this filter.
                </div>
              )}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                    <span className="font-mono text-zinc-400 text-[11px]">
                      District Grid
                    </span>
                  </div>
                  <h4 className="font-heading text-base font-bold text-zinc-900">
                    {agency.name}
                  </h4>
                  <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1.5">
                    📍 {agency.district}
                  </p>

                  <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-600">
                      <span>Weekly Schedule:</span>
                      <strong className="text-zinc-900">{agency.weeklyPickupDays}</strong>
                    </div>
                    <div className="flex items-center justify-between text-zinc-600">
                      <span>Dispatch Phone:</span>
                      <strong className="text-emerald-700">{agency.phone}</strong>
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
                    Submit Report to This Agency →
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              ✓ Bulky pickup scheduled! Routed to the selected agency dispatch.
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
                <option value="Commercial Wood / Construction Debris">Commercial Wood / Construction Debris</option>
                <option value="Large E-Waste / Appliances (Fridges, TVs)">Large E-Waste / Appliances (Fridges, TVs)</option>
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
                className="w-full py-3 px-5 rounded-xl bg-[#1f7a4d] hover:bg-[#123321] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
              >
                Submit Bulky Pickup Request
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
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold"
              >
                ✕
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

              {/* 3. LOCATION */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                  3. Street Address / Location
                </label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1f7a4d] focus:outline-none"
                />
              </div>

              {/* 4. WASTE CATEGORY */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                  4. Waste Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["General", "Recyclable", "Organic", "Hazardous"] as const).map((cat) => (
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
                  ))}
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
                          ? "border-[#1f7a4d] bg-[#123321] text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                      }`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo preview selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                  6. Attach Photo Evidence
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { path: "/images/citizen_reporting_bin.jpg", label: "Bin Overflow" },
                    { path: "/images/waste_collection_truck.jpg", label: "Street Refuse" },
                    { path: "/images/waste_collectors_work.jpg", label: "Bulk Crates" },
                  ].map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => setSelectedPhoto(item.path)}
                      className={`relative h-18 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedPhoto === item.path ? "border-[#1f7a4d] ring-2 ring-[#1f7a4d]" : "border-zinc-200 opacity-70"
                      }`}
                    >
                      <Image src={item.path} alt={item.label} fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-[10px] text-white font-bold">
                        {item.label}
                      </div>
                    </button>
                  ))}
                </div>
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
