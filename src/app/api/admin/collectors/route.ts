import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    const url = new URL(request.url);
    let agencyId = url.searchParams.get("agencyId") || session?.agencyId;
    if (!agencyId) {
      const firstAgency = await prisma.wasteAgency.findFirst();
      agencyId = firstAgency?.id || "";
    }

    const profiles = await prisma.collectorProfile.findMany({
      where: { agencyId },
      include: {
        user: true,
        assignedIncidents: {
          where: {
            status: { not: "Resolved" },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const collectors = profiles.map((p) => ({
      id: p.id,
      agencyId: p.agencyId,
      name: p.user.fullName,
      email: p.user.email,
      truckUnit: p.truckUnit,
      plateNumber: p.plateNumber,
      status: p.status,
      compactorLoad: p.compactorLoad,
      activeTasks: p.assignedIncidents.length,
      isActive: p.isActive,
      joinedDate: p.joinedDate,
    }));

    return NextResponse.json({ collectors });
  } catch (error: any) {
    console.error("Error fetching collectors:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch collectors." },
      { status: 500 }
    );
  }
}
