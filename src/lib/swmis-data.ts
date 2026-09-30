// GreenLoop SWMIS - Central Data Layer & State Helpers

export type WasteCategory = "General" | "Recyclable" | "Organic" | "Hazardous" | "Flood & Drainage";
export type ReportUrgency = "Normal" | "High" | "Critical";
export type ReportStatus =
  | "Pending Agency Review"
  | "Collector Assigned"
  | "In-Progress"
  | "Resolved";

export type UserRole = "citizen" | "collector" | "admin";

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  lga?: string;
  address?: string;
  // Collector specific
  agencyId?: string;
  agencyName?: string;
  truckUnit?: string;
  plateNumber?: string;
  isActive?: boolean;
  // Admin specific
  organizationName?: string;
  organizationType?: "Municipal Authority" | "Private PSP Operator";
  agencyCode?: string;
  createdAt: string;
}

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
  image?: string; // Optional image attachment
  createdAt: string;
  timeAgo: string;
  submittedBy: string;
  weightCollectedKg?: number;
  completedAt?: string;
  isMyReport?: boolean;
  citizenId?: string;
  // Flood and emergency reporting extensions
  isFloodReport?: boolean;
  floodDepth?: "Ankle-Deep" | "Knee-Deep" | "Waist-Deep (Severe)" | "Submerged Infrastructure";
  drainageBlockage?: string;
  affectedInfrastructure?: string;
  governmentAgencyDispatched?: string;
}

// Real dynamic data defaults (empty - live data fetched from Neon PostgreSQL)
export const DEFAULT_AGENCIES: WasteAgency[] = [];

// Real dynamic collectors default
export const DEFAULT_COLLECTORS: CollectorUser[] = [];

// Real dynamic incident reports default
export const DEFAULT_REPORTS: IncidentReport[] = [];

// Helper to generate a new random Agency Code (e.g. "LCWA-5129")
export function generateAgencyCode(prefix = "LCWA"): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}

// LocalStorage Keys
const STORAGE_KEYS = {
  AGENCIES: "greenloop_agencies_v2",
  COLLECTORS: "greenloop_collectors_v2",
  REPORTS: "greenloop_reports_v2",
};

// Safe retrieval helpers with LocalStorage caching
export function getStoredAgencies(): WasteAgency[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AGENCIES);
    if (!raw) return [];
    const parsed: WasteAgency[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLECTORS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
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
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) return [];
    const parsed: IncidentReport[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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

  const fallback: WasteAgency = {
    id: agencyId,
    name: "Registered Agency",
    code: newCode,
    district: "Municipal District",
    phone: "",
    email: "",
    type: "Municipal Authority",
    weeklyPickupDays: "Standard Schedule",
  };
  return { agency: fallback, newCode };
}


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
