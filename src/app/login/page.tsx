"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredCollectors } from "@/lib/swmis-data";

type LoginRole = "citizen" | "collector" | "admin";

interface SlideItem {
  image: string;
  alt: string;
  badge: string;
  caption: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>("citizen");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [email, setEmail] = useState("amara@lagosgreen.org");
  const [password, setPassword] = useState("greenloop2026");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  // Auto-cycle the visual slides every 4 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  // When changing role, populate credentials for rapid testing
  const handleRoleChange = (selectedRole: LoginRole) => {
    setRole(selectedRole);
    setErrorMessage("");
    setStatusMessage("");
    if (selectedRole === "citizen") {
      setEmail("amara@lagosgreen.org");
      setPassword("greenloop2026");
    } else if (selectedRole === "collector") {
      setEmail("tunde@dispatch.swmis.org");
      setPassword("greenloop2026");
    } else {
      setEmail("adams@lcwa.gov.ng");
      setPassword("greenloop2026");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsLoading(false);
        setErrorMessage(data.error || "Sign in failed. Please verify your credentials.");
        return;
      }

      const userRole = data.user?.role?.toLowerCase() || role;
      setStatusMessage(`Signed in as ${data.user.fullName} (${data.user.role})! Redirecting...`);

      if (typeof window !== "undefined") {
        localStorage.setItem("swmis_current_user", JSON.stringify(data.user));
      }

      setTimeout(() => {
        if (userRole === "collector") {
          router.push("/collector");
        } else if (userRole === "admin") {
          router.push("/admin");
        } else {
          router.push("/citizen");
        }
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Network error: Unable to reach the authentication server.");
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0e1310] flex flex-col lg:flex-row">
      {/* ================= LEFT PANEL: CLEAN VISUAL CAROUSEL ================= */}
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

      {/* ================= RIGHT PANEL: ELEVATED LOGIN FORM ================= */}
      <div className="lg:w-[58%] xl:w-[62%] bg-[#ffffff] p-8 sm:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0e1310]">
              Sign in to GreenLoop
            </h1>
            <p className="mt-2 text-sm text-[#0e1310]/70">
              Access your role-specific municipal waste portal
            </p>
          </div>

          {/* Feedback message */}
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-xs font-semibold text-red-800">
              ⚠️ {errorMessage}
            </div>
          )}

          {statusMessage && (
            <div className="mb-6 rounded-xl border border-[#1f7a4d]/30 bg-[#eaf3ec] p-4 text-center text-xs font-semibold text-[#123321]">
              {statusMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector Tabs (3 Roles) */}
            <div>
              <label className="block text-xs font-semibold text-[#0e1310] mb-2 uppercase tracking-wider">
                Select Account Role
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleRoleChange("citizen")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    role === "citizen"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange("collector")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    role === "collector"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Collector
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange("admin")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    role === "admin"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Agency Admin
                </button>
              </div>
            </div>

            {/* Role explanation pill */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-[11px] text-zinc-600">
              {role === "citizen" && (
                <span>
                  <strong>Citizen Portal:</strong> Submit incident reports with direct waste agency selection, track active dispatches, and book bulky pickups.
                </span>
              )}
              {role === "collector" && (
                <span>
                  <strong>Collector Dispatch:</strong> View stops assigned by admin, turn-by-turn routing, compactor telemetry, and sign off site clearances.
                </span>
              )}
              {role === "admin" && (
                <span>
                  <strong>Agency Command:</strong> Manage Agency Affiliation Code, assign collectors to citizen reports, and monitor fleet SLA performance.
                </span>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#0e1310] mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#0e1310]/20 bg-white px-3.5 py-2.5 text-sm text-[#0e1310] focus:border-[#1f7a4d] focus:outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#0e1310]">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#0e1310]/20 bg-white px-3.5 py-2.5 text-sm text-[#0e1310] focus:border-[#1f7a4d] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-[#1f7a4d] px-5 py-3 text-sm font-semibold text-[#ffffff] hover:bg-[#123321] transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {isLoading
                ? "Authenticating..."
                : `Sign In as ${
                    role === "citizen"
                      ? "Citizen"
                      : role === "collector"
                      ? "Collector"
                      : "Agency Admin"
                  }`}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#0e1310]/70">
            Don’t have an account?{" "}
            <Link href="/signup" className="font-semibold text-[#0e1310] hover:text-[#1f7a4d] transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
