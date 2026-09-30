import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    const url = new URL(request.url);
    const requestedAgencyId = url.searchParams.get("agencyId") || session?.agencyId;

    let agency = null;

    if (requestedAgencyId) {
      agency = await prisma.wasteAgency.findUnique({
        where: { id: requestedAgencyId },
      });
    }

    // If not specified or not found, try to find agency administered by the current session user
    if (!agency && session?.id) {
      const userWithAgency = await prisma.user.findUnique({
        where: { id: session.id },
        include: { administeredAgencies: true },
      });
      if (userWithAgency?.administeredAgencies?.length) {
        agency = userWithAgency.administeredAgencies[0];
      }
    }

    // Fallback to first agency in database
    if (!agency) {
      agency = await prisma.wasteAgency.findFirst();
    }

    if (!agency) {
      return NextResponse.json({ error: "Agency not found." }, { status: 404 });
    }

    // Look up the admin user for this agency from the database
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
        administeredAgencies: {
          some: { id: agency.id },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    const realAdminName = session?.fullName || adminUser?.fullName || "Agency Director";
    const realAdminEmail = session?.email || adminUser?.email || agency.email;

    return NextResponse.json({
      agency,
      adminUser: {
        fullName: realAdminName,
        email: realAdminEmail,
      },
    });
  } catch (error: any) {
    console.error("Error fetching agency details:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load agency details." },
      { status: 500 }
    );
  }
}
