import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    const url = new URL(request.url);
    const requestedCollectorId = url.searchParams.get("collectorId");
    const requestedEmail = url.searchParams.get("email");

    let profile = null;

    if (requestedCollectorId) {
      profile = await prisma.collectorProfile.findUnique({
        where: { id: requestedCollectorId },
        include: { user: true, agency: true },
      });
    } else if (requestedEmail) {
      const user = await prisma.user.findUnique({
        where: { email: requestedEmail.toLowerCase().trim() },
        include: {
          collectorProfile: {
            include: { agency: true, user: true },
          },
        },
      });
      profile = user?.collectorProfile || null;
    } else if (session?.collectorProfileId) {
      profile = await prisma.collectorProfile.findUnique({
        where: { id: session.collectorProfileId },
        include: { user: true, agency: true },
      });
    } else if (session?.id) {
      profile = await prisma.collectorProfile.findUnique({
        where: { userId: session.id },
        include: { user: true, agency: true },
      });
    }

    // Fallback: first active collector in the database
    if (!profile) {
      profile = await prisma.collectorProfile.findFirst({
        where: { isActive: true },
        include: { user: true, agency: true },
      });
    }

    if (!profile) {
      return NextResponse.json({ error: "Collector profile not found." }, { status: 404 });
    }

    const collectorData = {
      id: profile.id,
      userId: profile.userId,
      name: profile.user.fullName,
      email: profile.user.email,
      phone: profile.user.phone,
      agencyId: profile.agencyId,
      agencyName: profile.agency.name,
      truckUnit: profile.truckUnit,
      plateNumber: profile.plateNumber,
      status: profile.status,
      compactorLoad: profile.compactorLoad,
      activeTasks: profile.activeTasks,
      isActive: profile.isActive,
      joinedDate: profile.joinedDate,
    };

    return NextResponse.json({
      collector: collectorData,
      agency: profile.agency,
    });
  } catch (error: any) {
    console.error("Error fetching collector profile:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load collector profile." },
      { status: 500 }
    );
  }
}
