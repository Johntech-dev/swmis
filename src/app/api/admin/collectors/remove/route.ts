import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { collectorId } = body;

    if (!collectorId) {
      return NextResponse.json(
        { error: "Collector ID is required." },
        { status: 400 }
      );
    }

    // Find the collector profile
    const collector = await prisma.collectorProfile.findUnique({
      where: { id: collectorId },
      include: {
        agency: true,
        user: true,
      },
    });

    if (!collector) {
      return NextResponse.json(
        { error: "Collector not found." },
        { status: 404 }
      );
    }

    // 1. Deactivate collector
    const updatedCollector = await prisma.collectorProfile.update({
      where: { id: collectorId },
      data: {
        isActive: false,
        status: "Deactivated",
      },
    });

    // 2. Automatically generate and update new agency code for security
    const prefix = collector.agency.code.split("-")[0] || "LCWA";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newAgencyCode = `${prefix.toUpperCase()}-${randomNum}`;

    const updatedAgency = await prisma.wasteAgency.update({
      where: { id: collector.agencyId },
      data: { code: newAgencyCode },
    });

    return NextResponse.json({
      success: true,
      newAgencyCode: updatedAgency.code,
      collectorName: collector.user.fullName,
      message: `${collector.user.fullName} has been removed. Agency code has been rotated to ${updatedAgency.code} for security.`,
    });
  } catch (error: any) {
    console.error("Error removing collector:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to remove collector." },
      { status: 500 }
    );
  }
}
