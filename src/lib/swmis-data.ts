// GreenLoop SWMIS - Central Data Layer & State Helpers

export type WasteCategory = "General" | "Recyclable" | "Organic" | "Hazardous";
export type ReportUrgency = "Normal" | "High" | "Critical";
export type ReportStatus =
  | "Pending Agency Review"
  | "Collector Assigned"
  | "In-Progress"
  | "Resolved";

export interface WasteAgency {
  id: string;
  name: string;
  code: string; // Agency Affiliation Code for collectors
  district: string;
  phone: string;
  email: string;
  type: "Municipal Authority" | "Private PSP Operator";
  weeklyPickupDays: string;
}

export interface CollectorUser {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  truckUnit: string;
  plateNumber: string;
  status: "On Shift" | "Available" | "Maintenance" | "Deactivated";
  compactorLoad: number; // Percentage (0 - 100)
  activeTasks: number;
  isActive: boolean; // False if removed by admin
  joinedDate: string;
}

export interface IncidentReport {
  id: string;
  title: string;
  description: string;
  location: string;
  category: WasteCategory;
  urgency: ReportUrgency;
  agencyId: string;
  agencyName: string;
  status: ReportStatus;
  assignedCollectorId?: string;
  assignedCollectorName?: string;
  assignedCollectorUnit?: string;
  image: string;
  createdAt: string;
  timeAgo: string;
  submittedBy: string;
  weightCollectedKg?: number;
  completedAt?: string;
}

// Initial default agencies
export const DEFAULT_AGENCIES: WasteAgency[] = [
  {
    id: "agency-vi",
    name: "Lagos Central Waste Authority",
    code: "LCWA-8492",
    district: "Victoria Island & Ikoyi Corridor",
    phone: "+234 1 800-WASTE",
    email: "operations@lcwa.gov.ng",
    type: "Municipal Authority",
    weeklyPickupDays: "Tuesdays & Saturdays",
  },
  {
    id: "agency-lekki",
    name: "CleanCity PSP Operators",
    code: "CCPO-3319",
    district: "Lekki Phase 1, Phase 2 & Ikate",
    phone: "+234 1 844-CLEAN",
    email: "dispatch@cleancity.ng",
    type: "Private PSP Operator",
    weeklyPickupDays: "Mondays & Thursdays",
  },
  {
    id: "agency-mainland",
    name: "Mainland Metro Sanitation Services",
    code: "MMSS-6104",
    district: "Ikeja, Yaba & Surulere Sector",
    phone: "+234 1 822-METRO",
    email: "support@metroswmis.ng",
    type: "Private PSP Operator",
    weeklyPickupDays: "Wednesdays & Fridays",
  },
];

// Initial default collectors
export const DEFAULT_COLLECTORS: CollectorUser[] = [
  {
    id: "col-1",
    agencyId: "agency-vi",
    name: "Tunde Adeleke",
    email: "tunde@dispatch.swmis.org",
    truckUnit: "Compactor Unit #04",
    plateNumber: "LAG-782-X",
    status: "On Shift",
    compactorLoad: 68,
    activeTasks: 1,
    isActive: true,
    joinedDate: "Jan 14, 2026",
  },
  {
    id: "col-2",
    agencyId: "agency-vi",
    name: "Emeka Okafor",
    email: "emeka@dispatch.swmis.org",
    truckUnit: "Recycling Truck #02",
    plateNumber: "LAG-441-K",
    status: "Available",
    compactorLoad: 32,
    activeTasks: 0,
    isActive: true,
    joinedDate: "Feb 02, 2026",
  },
  {
    id: "col-3",
    agencyId: "agency-vi",
    name: "Babajide Kareem",
    email: "babajide@dispatch.swmis.org",
    truckUnit: "Heavy Flatbed #08",
    plateNumber: "LAG-902-B",
    status: "On Shift",
    compactorLoad: 85,
    activeTasks: 2,
    isActive: true,
    joinedDate: "Mar 10, 2026",
  },
];

// Initial default incident reports
export const DEFAULT_REPORTS: IncidentReport[] = [
  {
    id: "REP-2481",
    title: "Overflowing commercial bin on curb corner",
    description: "Multiple plastic containers and refuse spilling out into the pedestrian lane.",
    location: "Adeola Street, Victoria Island",
    category: "General",
    urgency: "High",
    agencyId: "agency-vi",
    agencyName: "Lagos Central Waste Authority",
    status: "Collector Assigned",
    assignedCollectorId: "col-1",
    assignedCollectorName: "Tunde Adeleke",
    assignedCollectorUnit: "Compactor Unit #04",
    image: "/images/citizen_reporting_bin.jpg",
    createdAt: "2026-09-23T07:45:00Z",
    timeAgo: "25 mins ago",
    submittedBy: "Amara Okafor",
  },
  {
    id: "REP-2485",
    title: "Uncollected market waste blocking drainage",
    description: "Decomposed organic market produce and packing crates needing immediate clearance.",
    location: "Kofo Abayomi Street, Victoria Island",
    category: "Organic",
    urgency: "Critical",
    agencyId: "agency-vi",
    agencyName: "Lagos Central Waste Authority",
    status: "Pending Agency Review",
    image: "/images/waste_collection_truck.jpg",
    createdAt: "2026-09-23T08:05:00Z",
    timeAgo: "10 mins ago",
    submittedBy: "Babatunde Alabi",
  },
  {
    id: "REP-2475",
    title: "Sorted cardboard & industrial packaging pile",
    description: "Bundle of flat packed boxes ready for paper recycling.",
    location: "Ahmadu Bello Way, Victoria Island",
    category: "Recyclable",
    urgency: "Normal",
    agencyId: "agency-vi",
    agencyName: "Lagos Central Waste Authority",
    status: "Resolved",
    assignedCollectorId: "col-2",
    assignedCollectorName: "Emeka Okafor",
    assignedCollectorUnit: "Recycling Truck #02",
    image: "/images/waste_collectors_work.jpg",
    createdAt: "2026-09-23T06:15:00Z",
    timeAgo: "2 hours ago",
    submittedBy: "Amara Okafor",
    weightCollectedKg: 420,
    completedAt: "2026-09-23T07:10:00Z",
  },
  {
    id: "REP-2469",
    title: "Restaurant cooking oil barrels in alley",
    description: "Three sealed drums of spent frying oil placed near rear exit.",
    location: "Saka Tinubu Street, Victoria Island",
    category: "Hazardous",
    urgency: "High",
    agencyId: "agency-vi",
    agencyName: "Lagos Central Waste Authority",
    status: "Pending Agency Review",
    image: "/images/citizen_reporting_bin.jpg",
    createdAt: "2026-09-23T08:12:00Z",
    timeAgo: "5 mins ago",
    submittedBy: "Chidinma Eze",
  },
];

// Helper to generate a new random Agency Code (e.g. "LCWA-5129")
export function generateAgencyCode(prefix = "LCWA"): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}

// LocalStorage Keys
const STORAGE_KEYS = {
  AGENCIES: "greenloop_agencies",
  COLLECTORS: "greenloop_collectors",
  REPORTS: "greenloop_reports",
};

// Safe retrieval helpers with LocalStorage caching
export function getStoredAgencies(): WasteAgency[] {
  if (typeof window === "undefined") return DEFAULT_AGENCIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AGENCIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AGENCIES, JSON.stringify(DEFAULT_AGENCIES));
      return DEFAULT_AGENCIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_AGENCIES;
  }
}

export function saveAgencies(agencies: WasteAgency[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.AGENCIES, JSON.stringify(agencies));
  } catch (err) {
    console.error("Failed to save agencies", err);
  }
}

export function getStoredCollectors(): CollectorUser[] {
  if (typeof window === "undefined") return DEFAULT_COLLECTORS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLECTORS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.COLLECTORS, JSON.stringify(DEFAULT_COLLECTORS));
      return DEFAULT_COLLECTORS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COLLECTORS;
  }
}

export function saveCollectors(collectors: CollectorUser[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.COLLECTORS, JSON.stringify(collectors));
  } catch (err) {
    console.error("Failed to save collectors", err);
  }
}

export function getStoredReports(): IncidentReport[] {
  if (typeof window === "undefined") return DEFAULT_REPORTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_REPORTS));
      return DEFAULT_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_REPORTS;
  }
}

export function saveReports(reports: IncidentReport[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  } catch (err) {
    console.error("Failed to save reports", err);
  }
}

/**
 * Reset Agency Code manually or automatically upon staff removal.
 * Returns the updated agency and new code.
 */
export function resetAgencyCodeInStorage(agencyId: string, customNewCode?: string): { agency: WasteAgency; newCode: string } {
  const agencies = getStoredAgencies();
  const index = agencies.findIndex((a) => a.id === agencyId);
  const prefix = index >= 0 ? agencies[index].code.split("-")[0] || "LCWA" : "LCWA";
  const newCode = customNewCode || generateAgencyCode(prefix);

  if (index >= 0) {
    agencies[index] = {
      ...agencies[index],
      code: newCode,
    };
    saveAgencies(agencies);
    return { agency: agencies[index], newCode };
  }

  const fallback = { ...DEFAULT_AGENCIES[0], code: newCode };
  return { agency: fallback, newCode };
}

/**
 * Remove / Deactivate a Collector from an Agency Fleet:
 * 1. Sets collector `isActive: false` and status to `Deactivated`.
 * 2. Unassigns any in-progress tasks back to 'Pending Agency Review'.
 * 3. AUTOMATICALLY RESETS the Agency Code so the dismissed worker cannot leak it.
 */
export function removeCollectorFromAgency(collectorId: string): {
  removedCollector: CollectorUser | null;
  newAgencyCode: string;
} {
  const collectors = getStoredCollectors();
  const colIndex = collectors.findIndex((c) => c.id === collectorId);

  if (colIndex === -1) {
    return { removedCollector: null, newAgencyCode: "" };
  }

  const removed = collectors[colIndex];
  const agencyId = removed.agencyId;

  // 1. Mark collector as deactivated
  collectors[colIndex] = {
    ...removed,
    isActive: false,
    status: "Deactivated",
    activeTasks: 0,
  };
  saveCollectors(collectors);

  // 2. Unassign any pending tasks assigned to this collector
  const reports = getStoredReports();
  const updatedReports = reports.map((rep) => {
    if (rep.assignedCollectorId === collectorId && rep.status !== "Resolved") {
      return {
        ...rep,
        status: "Pending Agency Review" as ReportStatus,
        assignedCollectorId: undefined,
        assignedCollectorName: undefined,
        assignedCollectorUnit: undefined,
      };
    }
    return rep;
  });
  saveReports(updatedReports);

  // 3. AUTOMATICALLY RESET THE AGENCY CODE
  const { newCode } = resetAgencyCodeInStorage(agencyId);

  return { removedCollector: collectors[colIndex], newAgencyCode: newCode };
}
