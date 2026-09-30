import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    const url = new URL(request.url);
    const requestedCollectorId = url.searchParams.get("collectorId") || session?.collectorProfileId;

    let collectorId = requestedCollectorId;

    if (!collectorId && session?.id) {
      const profile = await prisma.collectorProfile.findUnique({
        where: { userId: session.id },
      });
      collectorId = profile?.id;
    }

    // Fallback: first active collector
    if (!collectorId) {
      const firstCol = await prisma.collectorProfile.findFirst({
        where: { isActive: true },
      });
      collectorId = firstCol?.id;
    }

    if (!collectorId) {
      return NextResponse.json({ error: "Collector not found." }, { status: 404 });
    }

    const dbReports = await prisma.incidentReport.findMany({
      where: { assignedCollectorId: collectorId },
      include: {
        agency: true,
        citizen: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const reports = dbReports.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      location: r.location,
      category: r.category,
      urgency: r.urgency,
      agencyId: r.agencyId,
      agencyName: r.agency.name,
      status: r.status,
      assignedCollectorId: r.assignedCollectorId,
      image: r.image || "",
      createdAt: r.createdAt.toISOString(),
      timeAgo: formatTimeAgo(r.createdAt),
      submittedBy: r.citizen?.fullName || "Citizen",
      weightCollectedKg: r.weightCollectedKg,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      isFloodReport: r.isFloodReport,
      floodDepth: r.floodDepth,
      drainageBlockage: r.drainageBlockage,
      affectedInfrastructure: r.affectedInfrastructure,
      governmentAgencyDispatched: r.governmentAgencyDispatched,
    }));

    const assigned = reports.filter((r) => r.status !== "Resolved");
    const completed = reports.filter((r) => r.status === "Resolved");

    const totalWeightKg = completed.reduce((sum, r) => sum + (r.weightCollectedKg || 0), 0);

    return NextResponse.json({
      reports,
      assigned,
      completed,
      totalWeightKg,
      totalWeightTons: (totalWeightKg / 1000).toFixed(2),
    });
  } catch (error: any) {
    console.error("Error fetching collector jobs:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load assigned jobs." },
      { status: 500 }
    );
  }
}
