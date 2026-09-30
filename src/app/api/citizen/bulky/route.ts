import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    const body = await request.json();
    const {
      bulkyWasteType,
      bulkyAddress,
      bulkyDate,
      bulkyAgencyId,
      citizenEmail,
    } = body;

    if (!bulkyWasteType || !bulkyAddress) {
      return NextResponse.json(
        { error: "Waste type and pickup address are required." },
        { status: 400 }
      );
    }

    let citizenId = session?.id;
    if (!citizenId && citizenEmail) {
      const user = await prisma.user.findUnique({
        where: { email: citizenEmail.toLowerCase().trim() },
      });
      citizenId = user?.id;
    }

    let targetAgencyId = bulkyAgencyId;
    if (!targetAgencyId) {
      const firstAgency = await prisma.wasteAgency.findFirst();
      if (!firstAgency) {
        return NextResponse.json(
          { error: "No registered waste agencies found in the database." },
          { status: 400 }
        );
      }
      targetAgencyId = firstAgency.id;
    }

    const customId = `BLK-${Math.floor(1000 + Math.random() * 9000)}`;

    const report = await prisma.incidentReport.create({
      data: {
        id: customId,
        title: `Bulky Pickup: ${bulkyWasteType}`,
        description: `Scheduled bulky collection for ${bulkyWasteType} on ${bulkyDate || "upcoming scheduled pickup"}. Address: ${bulkyAddress}`,
        location: bulkyAddress.trim(),
        category: "General",
        urgency: "Normal",
        agencyId: targetAgencyId,
        citizenId: citizenId || null,
        status: "Pending Agency Review",
      },
    });

    return NextResponse.json({
      success: true,
      report,
      message: `Bulky collection booking confirmed (${customId}). Agency dispatch has been notified.`,
    });
  } catch (error: any) {
    console.error("Error creating bulky pickup:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to schedule bulky pickup." },
      { status: 500 }
    );
  }
}
