"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getStoredAgencies,
  saveAgencies,
  getStoredCollectors,
  saveCollectors,
  generateAgencyCode,
  WasteAgency,
  CollectorUser,
} from "@/lib/swmis-data";

type AccountType = "citizen" | "collector" | "admin";

interface SlideItem {
  image: string;
  alt: string;
  badge: string;
  caption: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("citizen");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Citizen field
  const [neighborhood, setNeighborhood] = useState("");

  // Collector fields
  const [truckUnit, setTruckUnit] = useState("");
  const [agencyCode, setAgencyCode] = useState("");

  // Admin / Organization fields
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState<"Municipal Authority" | "Private PSP Operator">(
    "Municipal Authority"
  );
  const [operatingDistrict, setOperatingDistrict] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const slides: SlideItem[] = [
    {
      image: "/images/lagos_citizen_reporting.jpg",
      alt: "Black Nigerian woman reporting an overflowing waste bin using her smartphone in Lagos",
      badge: "Citizen Waste Reporting",
      caption: "Select your designated waste agency and submit GPS-tagged reports with optional photo.",
    },
    {
      image: "/images/lagos_flood_alert.jpg",
      alt: "Black Nigerian citizen reporting severe street flooding and blocked storm drainage to the government",
      badge: "Government Flood Alerts",
      caption: "Direct citizen emergency alerts to state drainage authorities and rapid response units.",
    },
    {
      image: "/images/lagos_waste_truck.jpg",
      alt: "Green LAWMA municipal waste collection truck with Black Nigerian driver in Lagos",
      badge: "Agency Fleet Operations",
      caption: "Sanitation crews register using authorized agency affiliation codes.",
    },
    {
      image: "/images/lagos_sanitation_crew.jpg",
      alt: "Black Nigerian LAWMA sanitation workers loading waste into compactor truck in Lagos",
      badge: "Admin Dispatch Command",
      caption: "Agency directors triage incidents and manage driver rosters in real-time.",
    },
  ];

  // Auto-cycle visual carousel
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role: accountType,
          neighborhood,
          truckUnit,
          agencyCode,
          organizationName,
          organizationType,
          operatingDistrict,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsSubmitting(false);
        setErrorMessage(data.error || "Registration failed. Please verify your details.");
        return;
      }

      setIsSubmitting(false);
      setSuccessMessage(
        accountType === "admin" && data.agencyCode
          ? `✓ Agency registered! Your Agency Affiliation Code is ${data.agencyCode}. Redirecting...`
          : data.message || "✓ Account created successfully! Redirecting to login..."
      );

      if (typeof window !== "undefined" && data.user) {
        localStorage.setItem("swmis_current_user", JSON.stringify(data.user));
      }

      setTimeout(() => router.push("/login"), 1600);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage("Network error: Could not contact registration service.");
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0e1310] flex flex-col lg:flex-row">
      {/* ================= LEFT PANEL: VISUAL CAROUSEL ================= */}
      <div
        className="lg:w-[42%] xl:w-[38%] bg-[#123321] text-[#ffffff] p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden min-h-[560px] lg:min-h-screen"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#1f7a4d]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#1f7a4d]/20 blur-3xl" />

        <div className="relative z-10">
          <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-[#ffffff] inline-block">
            Green<span className="text-[#4ade80]">Loop</span>
          </Link>
        </div>

        <div className="relative z-10 my-auto w-full max-w-md mx-auto">
          <div className="relative w-full h-[460px] sm:h-[500px] rounded-3xl overflow-hidden border border-[#ffffff]/15 shadow-2xl group">
            <Image
              src={`${slides[activeSlide].image}?v=lagos2`}
              alt={slides[activeSlide].alt}
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover object-center transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1310]/90 via-[#0e1310]/20 to-transparent" />

            <div className="absolute bottom-5 inset-x-5 rounded-2xl bg-[#123321]/90 border border-[#4ade80]/30 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#4ade80] uppercase tracking-wider text-[11px]">
                  {slides[activeSlide].badge}
                </span>
                <span className="font-mono text-[10px] text-[#eaf3ec]/70">
                  0{activeSlide + 1} / 03
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                {slides[activeSlide].caption}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeSlide === idx
                    ? "w-8 bg-[#4ade80]"
                    : "w-2 bg-[#ffffff]/30 hover:bg-[#ffffff]/50"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="hidden lg:block h-6" />
      </div>

      {/* ================= RIGHT PANEL: ELEVATED SIGNUP FORM ================= */}
      <div className="lg:w-[58%] xl:w-[62%] bg-[#ffffff] p-8 sm:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0e1310]">
              Create an Account
            </h1>
            <p className="mt-2 text-sm text-[#0e1310]/70">
              Select your organization or personal role in the waste management system.
            </p>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-xs font-semibold text-red-800">
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Type Selector (3 Roles) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccountType("citizen");
                  setErrorMessage("");
                }}
                className={`rounded-xl p-3 text-center border transition-all cursor-pointer ${
                  accountType === "citizen"
                    ? "border-[#1f7a4d] bg-[#eaf3ec] text-[#123321] ring-1 ring-[#1f7a4d] font-bold"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <div className="text-xs">Citizen</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountType("collector");
                  setErrorMessage("");
                }}
                className={`rounded-xl p-3 text-center border transition-all cursor-pointer ${
                  accountType === "collector"
                    ? "border-[#1f7a4d] bg-[#eaf3ec] text-[#123321] ring-1 ring-[#1f7a4d] font-bold"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <div className="text-xs">Collector</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountType("admin");
                  setErrorMessage("");
                }}
                className={`rounded-xl p-3 text-center border transition-all cursor-pointer ${
                  accountType === "admin"
                    ? "border-[#1f7a4d] bg-[#eaf3ec] text-[#123321] ring-1 ring-[#1f7a4d] font-bold"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <div className="text-xs">Agency Admin</div>
              </button>
            </div>

            {/* Collector Notice */}
            {accountType === "collector" && (
              <div className="p-3 rounded-xl bg-[#eaf3ec] border border-[#1f7a4d]/25 text-[11px] text-[#123321] leading-tight">
                <strong>Hiring Requirement:</strong> You must enter your authorized Waste Agency Affiliation Code (e.g. <code>LCWA-8492</code>) to bind to an agency fleet.
              </div>
            )}

            {/* Admin Notice */}
            {accountType === "admin" && (
              <div className="p-3 rounded-xl bg-[#eaf3ec] border border-[#1f7a4d]/25 text-[11px] text-[#123321] leading-tight">
                <strong>Agency Dispatch:</strong> Register your municipal waste authority or licensed private PSP operator to manage trucks and triage citizen reports.
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#0e1310] mb-1">
                {accountType === "admin" ? "Director / Officer Full Name" : "Full Name"}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={
                  accountType === "citizen"
                    ? "Amara Okafor"
                    : accountType === "collector"
                    ? "Tunde Adeleke"
                    : "Director Adams"
                }
                className="w-full rounded-xl border border-[#0e1310]/20 bg-white px-3.5 py-2.5 text-sm text-[#0e1310] focus:border-[#1f7a4d] focus:outline-none"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[#0e1310] mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                className="w-full rounded-xl border border-[#0e1310]/20 bg-white px-3.5 py-2.5 text-sm text-[#0e1310] focus:border-[#1f7a4d] focus:outline-none"
              />
            </div>

            {/* CITIZEN SPECIFIC FIELD */}
            {accountType === "citizen" && (
              <div>
                <label className="block text-xs font-semibold text-[#0e1310] mb-1">
                  Neighborhood / Residential Street
                </label>
                <input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="e.g. Adeola Street, Victoria Island"
                  className="w-full rounded-xl border border-[#0e1310]/20 bg-white px-3.5 py-2.5 text-sm text-[#0e1310] focus:border-[#1f7a4d] focus:outline-none"
                />
              </div>
            )}

            {/* COLLECTOR SPECIFIC FIELDS (MANDATORY AGENCY CODE) */}
            {accountType === "collector" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#0e1310] mb-1">
                    Vehicle / Compactor Unit ID
                  </label>
                  <input
                    type="text"
                    required
                    value={truckUnit}
                    onChange={(e) => setTruckUnit(e.target.value)}
                    placeholder="e.g. Compactor Unit #04"
                    className="w-full rounded-xl border border-[#0e1310]/20 bg-white px-3.5 py-2.5 text-sm text-[#0e1310] focus:border-[#1f7a4d] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      Agency Affiliation Code *
                    </label>
                    <span className="text-[10px] text-zinc-400">Demo Code: LCWA-8492</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={agencyCode}
                    onChange={(e) => setAgencyCode(e.target.value)}
                    placeholder="e.g. LCWA-8492"
                    className="w-full rounded-xl border-2 border-[#1f7a4d] bg-emerald-50/30 px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider text-emerald-950 uppercase focus:border-[#123321] focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* ADMIN SPECIFIC FIELDS */}
            {accountType === "admin" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#0e1310] mb-1">
                    Waste Agency / Operator Name
                  </label>
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Lagos Central Waste Authority"
                    className="w-full rounded-xl border border-[#0e1310]/20 bg-white px-3.5 py-2.5 text-sm text-[#0e1310] focus:border-[#1f7a4d] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0e1310] mb-1">
                      Organization Type
                    </label>
                    <select
                      value={organizationType}
                      onChange={(e) =>
                        setOrganizationType(e.target.value as "Municipal Authority" | "Private PSP Operator")
                      }
                      className="w-full rounded-xl border border-[#0e1310]/20 bg-white px-3 py-2.5 text-xs text-[#0e1310] focus:border-[#1f7a4d] focus:outline-none"
                    >
                      <option value="Municipal Authority">Municipal Authority</option>
                      <option value="Private PSP Operator">Private PSP Operator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0e1310] mb-1">
                      Operating District
                    </label>
                    <input
                      type="text"
                      required
                      value={operatingDistrict}
                      onChange={(e) => setOperatingDistrict(e.target.value)}
                      placeholder="e.g. Victoria Island & Ikoyi"
                      className="w-full rounded-xl border border-[#0e1310]/20 bg-white px-3 py-2.5 text-xs text-[#0e1310] focus:border-[#1f7a4d] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#0e1310] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-[#0e1310]/20 bg-white px-3.5 py-2.5 text-sm text-[#0e1310] focus:border-[#1f7a4d] focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-[#1f7a4d] px-5 py-3 text-sm font-semibold text-[#ffffff] hover:bg-[#123321] transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {isSubmitting
                ? "Registering..."
                : `Create ${
                    accountType === "citizen"
                      ? "Citizen"
                      : accountType === "collector"
                      ? "Collector"
                      : "Agency Admin"
                  } Account`}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#0e1310]/70">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#0e1310] hover:text-[#1f7a4d] transition-colors">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
