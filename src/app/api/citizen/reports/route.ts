import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

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
    const requestedCitizenId = url.searchParams.get("citizenId");
    const requestedEmail = url.searchParams.get("email");

    let citizenId: string | null | undefined = requestedCitizenId;

    if (!citizenId && requestedEmail) {
      const user = await prisma.user.findUnique({
        where: { email: requestedEmail.toLowerCase().trim() },
      });
      citizenId = user?.id || null;
    }

    if (!citizenId && session?.id) {
      citizenId = session.id;
    }

    // Query all community reports so citizen has complete tracking transparency
    const dbReports = await prisma.incidentReport.findMany({
      include: {
        agency: true,
        citizen: true,
        assignedCollector: {
          include: {
            user: true,
          },
        },
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
      assignedCollectorName: r.assignedCollector?.user.fullName || null,
      assignedCollectorUnit: r.assignedCollector?.truckUnit || null,
      image: r.image || "",
      createdAt: r.createdAt.toISOString(),
      timeAgo: formatTimeAgo(r.createdAt),
      submittedBy: r.citizen?.fullName || "Citizen",
      isMyReport: citizenId ? r.citizenId === citizenId : false,
      weightCollectedKg: r.weightCollectedKg,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      isFloodReport: r.isFloodReport,
      floodDepth: r.floodDepth,
      drainageBlockage: r.drainageBlockage,
      affectedInfrastructure: r.affectedInfrastructure,
      governmentAgencyDispatched: r.governmentAgencyDispatched,
    }));

    const totalCount = reports.length;
    const pendingCount = reports.filter((r) => r.status === "Pending Agency Review").length;
    const activeCount = reports.filter(
      (r) => r.status === "Collector Assigned" || r.status === "In-Progress"
    ).length;
    const resolvedCount = reports.filter((r) => r.status === "Resolved").length;
    const floodCount = reports.filter((r) => r.category === "Flood & Drainage" || r.isFloodReport).length;

    return NextResponse.json({
      reports,
      stats: {
        totalCount,
        pendingCount,
        activeCount,
        resolvedCount,
        floodCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching citizen reports:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load reports." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    const body = await request.json();
    const {
      title,
      description,
      location,
      category = "General",
      urgency = "Normal",
      agencyId,
      image = "",
      isFloodReport = false,
      floodDepth,
      drainageBlockage,
      affectedInfrastructure,
      governmentAgencyDispatched,
      citizenId: bodyCitizenId,
      citizenEmail,
    } = body;

    if (!title || !description || !location) {
      return NextResponse.json(
        { error: "Title, description, and location are required." },
        { status: 400 }
      );
    }

    // Determine target agency
    let resolvedAgencyId = agencyId;
    if (!resolvedAgencyId) {
      const defaultAgency = await prisma.wasteAgency.findFirst();
      if (!defaultAgency) {
        return NextResponse.json(
          { error: "No registered waste agencies found in the database." },
          { status: 400 }
        );
      }
      resolvedAgencyId = defaultAgency.id;
    }

    // Determine citizen user ID
    let resolvedCitizenId = bodyCitizenId || session?.id;

    if (!resolvedCitizenId && citizenEmail) {
      const matchedUser = await prisma.user.findUnique({
        where: { email: citizenEmail.toLowerCase().trim() },
      });
      resolvedCitizenId = matchedUser?.id;
    }

    if (!resolvedCitizenId) {
      // Find any citizen or the first citizen
      const fallbackCitizen = await prisma.user.findFirst({
        where: { role: "CITIZEN" },
      });
      resolvedCitizenId = fallbackCitizen?.id;
    }

    // Generate custom incident ID (e.g. FLD-xxxx or REP-xxxx)
    const prefix = isFloodReport || category === "Flood & Drainage" ? "FLD" : "REP";
    const customId = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReport = await prisma.incidentReport.create({
      data: {
        id: customId,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        category,
        urgency,
        agencyId: resolvedAgencyId,
        citizenId: resolvedCitizenId || null,
        image: image || "",
        status: "Pending Agency Review",
        isFloodReport: Boolean(isFloodReport),
        floodDepth: floodDepth || null,
        drainageBlockage: drainageBlockage || null,
        affectedInfrastructure: affectedInfrastructure || null,
        governmentAgencyDispatched: governmentAgencyDispatched || null,
      },
      include: {
        agency: true,
        citizen: true,
      },
    });

    return NextResponse.json({
      success: true,
      report: newReport,
      message: `Report ${newReport.id} created successfully and dispatched for agency review.`,
    });
  } catch (error: any) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit report." },
      { status: 500 }
    );
  }
}
