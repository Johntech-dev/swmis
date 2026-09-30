import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0e1310] flex flex-col">
      {/* 1. NAV BAR */}
      <header className="sticky top-0 z-50 w-full bg-[#ffffff]/90 backdrop-blur-md border-b border-[#0e1310]/10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-[#0e1310]">
            Green<span className="text-[#1f7a4d]">Loop</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#0e1310]/80">
            <a
              href="#how-it-works"
              className="hover:text-[#1f7a4d] transition-colors"
            >
              How it works
            </a>
            <a
              href="#operations"
              className="hover:text-[#1f7a4d] transition-colors"
            >
              Field Operations
            </a>
            <a
              href="#who-its-for"
              className="hover:text-[#1f7a4d] transition-colors"
            >
              Who it&apos;s for
            </a>
            <a
              href="#impact"
              className="hover:text-[#1f7a4d] transition-colors"
            >
              Impact
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold px-3 py-2 text-[#0e1310] hover:text-[#1f7a4d] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-[#1f7a4d] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#123321] transition-colors shadow-xs"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1f7a4d]/25 bg-[#eaf3ec] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#1f7a4d] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1f7a4d] animate-ping" />
                Waste Management & Government Flood Alert System
              </span>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-[#0e1310] leading-[1.12]">
                Report it. Track it. Watch it get cleared.
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-[#0e1310]/75 leading-relaxed font-normal">
                GreenLoop connects citizens, sanitation collectors, and municipal flood response teams in one continuous loop. Spot overflowing waste or hazardous street floods, alert authorities in seconds (photos optional), and track rapid field dispatch in real time.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/citizen"
                  className="inline-flex items-center justify-center rounded-xl bg-[#1f7a4d] px-6 py-3.5 text-sm sm:text-base font-semibold text-[#ffffff] hover:bg-[#123321] transition-colors text-center shadow-xs"
                >
                  Report Waste
                </Link>
                <Link
                  href="/citizen"
                  className="inline-flex items-center justify-center rounded-xl bg-[#123321] px-6 py-3.5 text-sm sm:text-base font-semibold text-[#ffffff] hover:bg-[#0e1310] transition-colors text-center shadow-xs"
                >
                  Report Flood to Govt
                </Link>
              </div>
            </div>

            {/* Right Column: Flat Vector Illustration + Live Report Status Card */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              {/* Custom Flat Vector Illustration: Waste Collector Loading Bin into Truck */}
              <div className="w-full rounded-2xl bg-[#eaf3ec] p-4 sm:p-6 border border-[#1f7a4d]/15 flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 540 230"
                  className="w-full h-auto max-h-[220px]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="Illustration of a municipal worker loading a waste bin into a collection truck"
                  role="img"
                >
                  {/* Ground line */}
                  <line x1="10" y1="210" x2="530" y2="210" stroke="#0e1310" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="20" y1="218" x2="160" y2="218" stroke="#1f7a4d" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
                  <line x1="380" y1="218" x2="520" y2="218" stroke="#1f7a4d" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />

                  {/* COLLECTION TRUCK */}
                  {/* Truck Main Body (Compactor) */}
                  <rect x="230" y="55" width="230" height="120" rx="8" fill="#123321" />
                  <rect x="240" y="65" width="120" height="100" rx="4" fill="#1f7a4d" />
                  {/* Subtle compactor ribs */}
                  <line x1="275" y1="65" x2="275" y2="165" stroke="#123321" strokeWidth="3" />
                  <line x1="310" y1="65" x2="310" y2="165" stroke="#123321" strokeWidth="3" />
                  <line x1="345" y1="65" x2="345" y2="165" stroke="#123321" strokeWidth="3" />

                  {/* Loop emblem on truck side */}
                  <circle cx="300" cy="115" r="18" fill="#ffffff" />
                  <path
                    d="M293 115a7 7 0 1 1 12 5l-2-2m-10-3a7 7 0 1 1 12-5l-2 2"
                    stroke="#1f7a4d"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Rear Hopper & Loading Mechanism */}
                  <path d="M230 75 L185 110 L185 175 L230 175 Z" fill="#123321" />
                  <rect x="175" y="125" width="22" height="42" rx="3" fill="#1f7a4d" />
                  {/* Hydraulic Lift Arm */}
                  <path d="M192 138 L162 160" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="162" cy="160" r="3.5" fill="#ffffff" />

                  {/* Truck Cab */}
                  <path d="M460 85 L500 85 L525 125 L525 175 L460 175 Z" fill="#1f7a4d" />
                  {/* Windshield */}
                  <path d="M470 95 L495 95 L515 125 L470 125 Z" fill="#ffffff" opacity="0.9" />
                  {/* Cab Door Line */}
                  <line x1="462" y1="85" x2="462" y2="175" stroke="#123321" strokeWidth="2" />
                  {/* Headlight */}
                  <rect x="520" y="145" width="6" height="12" rx="2" fill="#ffffff" />
                  {/* Bumper */}
                  <rect x="495" y="172" width="36" height="8" rx="2" fill="#0e1310" />

                  {/* Truck Wheels */}
                  {/* Rear Wheel 1 */}
                  <circle cx="270" cy="188" r="22" fill="#0e1310" />
                  <circle cx="270" cy="188" r="10" fill="#ffffff" />
                  <circle cx="270" cy="188" r="4" fill="#0e1310" />

                  {/* Rear Wheel 2 */}
                  <circle cx="330" cy="188" r="22" fill="#0e1310" />
                  <circle cx="330" cy="188" r="10" fill="#ffffff" />
                  <circle cx="330" cy="188" r="4" fill="#0e1310" />

                  {/* Front Wheel */}
                  <circle cx="485" cy="188" r="22" fill="#0e1310" />
                  <circle cx="485" cy="188" r="10" fill="#ffffff" />
                  <circle cx="485" cy="188" r="4" fill="#0e1310" />

                  {/* WHEELIE BIN (TILTING TOWARD HOPPER) */}
                  <g transform="rotate(18 140 160)">
                    {/* Bin Body */}
                    <path d="M125 105 L155 105 L150 172 L130 172 Z" fill="#1f7a4d" />
                    {/* Bin Lid */}
                    <rect x="122" y="99" width="36" height="6" rx="2" fill="#123321" />
                    <rect x="135" y="95" width="10" height="4" rx="1" fill="#123321" />
                    {/* Bin Wheel */}
                    <circle cx="132" cy="172" r="7" fill="#0e1310" />
                    <circle cx="132" cy="172" r="2.5" fill="#ffffff" />
                  </g>

                  {/* WASTE COLLECTOR (FIGURE) */}
                  {/* Head & Cap */}
                  <circle cx="88" cy="100" r="9" fill="#0e1310" />
                  <path d="M80 97 C80 92 96 92 98 97 L102 97 C102 97 101 99 97 99 Z" fill="#1f7a4d" />

                  {/* Torso & High-Vis Uniform */}
                  <path d="M79 110 L97 110 L94 152 L82 152 Z" fill="#1f7a4d" />
                  {/* Safety Stripe */}
                  <rect x="80" y="124" width="15" height="5" fill="#ffffff" />

                  {/* Arms wheeling the bin */}
                  <path d="M82 115 L106 130 L126 130" stroke="#0e1310" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Legs */}
                  <line x1="84" y1="152" x2="78" y2="204" stroke="#123321" strokeWidth="5.5" strokeLinecap="round" />
                  <line x1="92" y1="152" x2="98" y2="204" stroke="#123321" strokeWidth="5.5" strokeLinecap="round" />
                  {/* Safety Boots */}
                  <rect x="70" y="202" width="13" height="7" rx="2" fill="#0e1310" />
                  <rect x="94" y="202" width="13" height="7" rx="2" fill="#0e1310" />
                </svg>
              </div>

              {/* Live Report Status Card */}
              <div className="rounded-2xl border border-[#0e1310]/15 bg-[#ffffff] p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider uppercase text-[#1f7a4d]">
                    Report #2481
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf3ec] px-2.5 py-0.5 text-xs font-medium text-[#123321]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1f7a4d]" />
                    Live Update
                  </span>
                </div>

                <h2 className="font-heading text-xl font-bold text-[#0e1310] mt-2">
                  Overflowing bin — Adeola Street
                </h2>

                <p className="text-xs sm:text-sm text-[#0e1310]/60 mt-1">
                  General waste · Submitted 12 minutes ago
                </p>

                {/* 3-Stage Status Pill Row */}
                <div className="mt-6 pt-5 border-t border-[#0e1310]/10">
                  <div className="flex items-center justify-between">
                    {/* Stage 1: Reported (Filled Green) */}
                    <div className="inline-flex items-center justify-center rounded-full bg-[#1f7a4d] px-3.5 py-1 text-xs font-semibold text-[#ffffff]">
                      Reported
                    </div>

                    {/* Connecting Line 1 (Active) */}
                    <div className="h-0.5 flex-1 mx-2 bg-[#1f7a4d]" />

                    {/* Stage 2: Assigned (Filled Green) */}
                    <div className="inline-flex items-center justify-center rounded-full bg-[#1f7a4d] px-3.5 py-1 text-xs font-semibold text-[#ffffff]">
                      Assigned
                    </div>

                    {/* Connecting Line 2 (Pending) */}
                    <div className="h-0.5 flex-1 mx-2 bg-[#0e1310]/15" />

                    {/* Stage 3: Resolved (Outlined / Inactive) */}
                    <div className="inline-flex items-center justify-center rounded-full border border-[#0e1310]/30 bg-transparent px-3.5 py-1 text-xs font-medium text-[#0e1310]/50">
                      Resolved
                    </div>
                  </div>
                </div>

                {/* Collector Assignment Detail Line */}
                <div className="mt-5 rounded-xl bg-[#eaf3ec] p-3.5 border border-[#1f7a4d]/20 text-xs sm:text-sm text-[#123321] font-medium flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-[#1f7a4d] shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Assigned to <strong className="font-semibold text-[#0e1310]">Tunde A.</strong> — nearest available collector, 1.2 km away.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="w-full bg-[#eaf3ec] py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1f7a4d]">
              Simple 3-Step Process
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0e1310] mt-2">
              How it works
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#0e1310]/70">
              An intelligent, closed-loop reporting mechanism that eliminates dispatch delays and keeps public spaces spotless.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1: Report */}
            <div className="flex flex-col items-start bg-[#ffffff]/60 backdrop-blur-sm p-8 rounded-2xl border border-[#1f7a4d]/15">
              <span className="font-heading text-5xl sm:text-6xl font-bold text-[#1f7a4d]">
                1
              </span>
              <h3 className="font-heading text-xl font-bold text-[#0e1310] mt-4">
                Report
              </h3>
              <p className="mt-3 text-base text-[#0e1310]/75 leading-relaxed">
                Drop your location, choose waste or flood crisis, and attach photo evidence <span className="font-semibold text-[#1f7a4d]">(optional for emergency response)</span>.
              </p>
            </div>

            {/* Step 2: Assign */}
            <div className="flex flex-col items-start bg-[#ffffff]/60 backdrop-blur-sm p-8 rounded-2xl border border-[#1f7a4d]/15">
              <span className="font-heading text-5xl sm:text-6xl font-bold text-[#1f7a4d]">
                2
              </span>
              <h3 className="font-heading text-xl font-bold text-[#0e1310] mt-4">
                Assign
              </h3>
              <p className="mt-3 text-base text-[#0e1310]/75 leading-relaxed">
                The system routes reports automatically to the nearest collector or government emergency flood abatement gang.
              </p>
            </div>

            {/* Step 3: Resolve */}
            <div className="flex flex-col items-start bg-[#ffffff]/60 backdrop-blur-sm p-8 rounded-2xl border border-[#1f7a4d]/15">
              <span className="font-heading text-5xl sm:text-6xl font-bold text-[#1f7a4d]">
                3
              </span>
              <h3 className="font-heading text-xl font-bold text-[#0e1310] mt-4">
                Resolve
              </h3>
              <p className="mt-3 text-base text-[#0e1310]/75 leading-relaxed">
                The crew clears the site, restores canal drainage, and records weighbridge telemetry in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3.5 FIELD OPERATIONS & COMMUNITY ACTION GALLERY */}
      <section id="operations" className="w-full py-20 sm:py-28 bg-[#ffffff] border-b border-[#0e1310]/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1f7a4d]">
              Live Ecosystem in Action
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0e1310] mt-2">
              Empowering citizens & municipal crews
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#0e1310]/70">
              From everyday waste collection to emergency flood mitigation, GreenLoop coordinates real people on the ground in real time.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Citizen Waste Reporting */}
            <div className="group rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src="/images/lagos_citizen_reporting.jpg?v=lagos2"
                  alt="Black Nigerian citizen reporting curbside waste on a Lagos street"
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#123321]/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  Citizen Reporting
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-zinc-900">
                    Community Waste Flagging
                  </h3>
                  <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                    Residents report overflowing curbside bins and illegal dump spots directly to their designated sanitation operator.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] font-semibold text-[#1f7a4d]">
                  Photo Optional · GPS Tagged
                </div>
              </div>
            </div>

            {/* Card 2: Government Flood Alerts */}
            <div className="group rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src="/images/lagos_flood_alert.jpg?v=lagos2"
                  alt="Black Nigerian resident reporting street flood and clogged drainage to Lagos State Government"
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#123321]/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  Govt Flood Alert
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-zinc-900">
                    Flood & Drainage Hotline
                  </h3>
                  <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                    Citizens alert the State Government to flash floods and waste-clogged canals with instant dispatch to EFAG emergency teams.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] font-semibold text-[#1f7a4d]">
                  Direct Government Dispatch
                </div>
              </div>
            </div>

            {/* Card 3: Municipal Fleet */}
            <div className="group rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src="/images/lagos_waste_truck.jpg?v=lagos2"
                  alt="Black Nigerian driver operating a green LAWMA municipal compactor truck on a Lagos street"
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#123321]/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  Fleet Security
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-zinc-900">
                    Regulated Municipal Fleet
                  </h3>
                  <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                    Drivers register using agency affiliation codes, ensuring only verified PSP vehicles operate within designated zones.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] font-semibold text-[#1f7a4d]">
                  Agency Code Verified
                </div>
              </div>
            </div>

            {/* Card 4: Sanitation Crew Action */}
            <div className="group rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src="/images/lagos_sanitation_crew.jpg?v=lagos2"
                  alt="Black Nigerian sanitation crew loading refuse bags into a LAWMA compactor truck in Lagos"
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#123321]/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  Crew Resolution
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-zinc-900">
                    Rapid Field Clearance
                  </h3>
                  <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                    Field crews receive real-time routing to incidents, clear hotspots, and record weight with digital proof of service.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] font-semibold text-[#1f7a4d]">
                  Real-Time Telemetry
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ROLES SECTION */}
      <section id="who-its-for" className="w-full py-20 sm:py-28 bg-[#ffffff]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1f7a4d]">
              Unified Ecosystem
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0e1310] mt-2">
              Built for everyone in the loop
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#0e1310]/70">
              Each stakeholder gets dedicated, purposeful tools designed to streamline sanitation actions.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Citizens Card */}
            <div className="rounded-2xl border border-[#0e1310]/15 p-8 bg-transparent hover:border-[#1f7a4d] transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#eaf3ec] flex items-center justify-center text-[#1f7a4d] font-heading font-bold text-lg mb-6">
                  C
                </div>
                <h3 className="font-heading text-2xl font-bold text-[#0e1310]">
                  Citizens
                </h3>
                <p className="mt-4 text-base text-[#0e1310]/75 leading-relaxed">
                  Citizens quickly flag overflowing waste hotspots in seconds, follow real-time collection status on an interactive map, and keep their streets clean.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-[#0e1310]/10 text-xs font-semibold text-[#1f7a4d] uppercase tracking-wider">
                Role: Reporting & Tracking
              </div>
            </div>

            {/* Collectors Card */}
            <div className="rounded-2xl border border-[#0e1310]/15 p-8 bg-transparent hover:border-[#1f7a4d] transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#eaf3ec] flex items-center justify-center text-[#1f7a4d] font-heading font-bold text-lg mb-6">
                  K
                </div>
                <h3 className="font-heading text-2xl font-bold text-[#0e1310]">
                  Collectors
                </h3>
                <p className="mt-4 text-base text-[#0e1310]/75 leading-relaxed">
                  Collectors receive proximity-based automatic dispatch tasks, turn-by-turn routing to bins, and complete jobs instantly with photographic sign-off.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-[#0e1310]/10 text-xs font-semibold text-[#1f7a4d] uppercase tracking-wider">
                Role: Route & Resolution
              </div>
            </div>

            {/* Admins Card */}
            <div className="rounded-2xl border border-[#0e1310]/15 p-8 bg-transparent hover:border-[#1f7a4d] transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#eaf3ec] flex items-center justify-center text-[#1f7a4d] font-heading font-bold text-lg mb-6">
                  A
                </div>
                <h3 className="font-heading text-2xl font-bold text-[#0e1310]">
                  Admins
                </h3>
                <p className="mt-4 text-base text-[#0e1310]/75 leading-relaxed">
                  Admins oversee live fleet operations, analyze recurrent overflow zones, track SLA adherence, and make data-driven sanitation investments.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-[#0e1310]/10 text-xs font-semibold text-[#1f7a4d] uppercase tracking-wider">
                Role: Oversight & Analytics
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. IMPACT SECTION */}
      <section id="impact" className="w-full bg-[#123321] text-[#ffffff] py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#eaf3ec]/80">
              Measurable Outcomes
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#ffffff] mt-2">
              Waste, categorized and understood
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#eaf3ec]/80 leading-relaxed">
              Every citizen report captures waste category, location density, and timestamp data — transforming isolated cleanups into actionable city-wide intelligence.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pt-8 border-t border-[#ffffff]/15">
            {/* Stat Block 1 */}
            <div className="flex flex-col">
              <span className="font-heading text-5xl sm:text-6xl font-bold tracking-tight text-[#ffffff]">
                61%
              </span>
              <p className="mt-3 text-base sm:text-lg text-[#eaf3ec]/80 font-medium">
                Organic & recyclable waste
              </p>
              <p className="mt-1 text-xs sm:text-sm text-[#eaf3ec]/60">
                Sorted directly at source through categorised community tagging.
              </p>
            </div>

            {/* Stat Block 2 */}
            <div className="flex flex-col">
              <span className="font-heading text-5xl sm:text-6xl font-bold tracking-tight text-[#ffffff]">
                2.4h
              </span>
              <p className="mt-3 text-base sm:text-lg text-[#eaf3ec]/80 font-medium">
                Average resolution time
              </p>
              <p className="mt-1 text-xs sm:text-sm text-[#eaf3ec]/60">
                From initial incident report submission to collector photographic confirmation.
              </p>
            </div>

            {/* Stat Block 3 */}
            <div className="flex flex-col">
              <span className="font-heading text-5xl sm:text-6xl font-bold tracking-tight text-[#ffffff]">
                3
              </span>
              <p className="mt-3 text-base sm:text-lg text-[#eaf3ec]/80 font-medium">
                Zones flagged for extra collection
              </p>
              <p className="mt-1 text-xs sm:text-sm text-[#eaf3ec]/60">
                Identified automatically using spatial clustering to prevent recurring overflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="w-full bg-[#ffffff] border-t border-[#0e1310]/10 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 pb-12 border-b border-[#0e1310]/10">
            <div>
              <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-[#0e1310]">
                Green<span className="text-[#1f7a4d]">Loop</span>
              </Link>
              <p className="text-sm text-[#0e1310]/70 mt-2">
                A smart waste management information system.
              </p>
            </div>

            <div>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md bg-[#1f7a4d] px-6 py-3 text-sm font-medium text-[#ffffff] hover:bg-[#123321] transition-colors"
              >
                Create an account
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#0e1310]/50">
            <p>© {new Date().getFullYear()} GreenLoop. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#privacy" className="hover:text-[#1f7a4d] transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-[#1f7a4d] transition-colors">Terms of Service</a>
              <a href="#contact" className="hover:text-[#1f7a4d] transition-colors">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


