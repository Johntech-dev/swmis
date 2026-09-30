import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    let agencyId = body?.agencyId || session?.agencyId;
    let agency = null;

    if (agencyId) {
      agency = await prisma.wasteAgency.findUnique({
        where: { id: agencyId },
      });
    }

    if (!agency) {
      agency = await prisma.wasteAgency.findFirst();
      if (agency) agencyId = agency.id;
    }

    if (!agency) {
      return NextResponse.json({ error: "Agency not found." }, { status: 404 });
    }

    // Determine prefix (e.g. LCWA from name or existing code)
    const prefix = agency.code.split("-")[0] || "LCWA";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newCode = `${prefix.toUpperCase()}-${randomNum}`;

    const updatedAgency = await prisma.wasteAgency.update({
      where: { id: agencyId },
      data: { code: newCode },
    });

    return NextResponse.json({
      success: true,
      newCode: updatedAgency.code,
      agency: updatedAgency,
      message: `Agency Code successfully updated to ${updatedAgency.code}`,
    });
  } catch (error: any) {
    console.error("Error resetting agency code:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update agency code." },
      { status: 500 }
    );
  }
}
