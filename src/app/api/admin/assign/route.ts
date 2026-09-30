import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reportId, collectorId } = body;

    if (!reportId || !collectorId) {
      return NextResponse.json(
        { error: "Both reportId and collectorId are required." },
        { status: 400 }
      );
    }

    const collector = await prisma.collectorProfile.findUnique({
      where: { id: collectorId },
      include: { user: true },
    });

    if (!collector || !collector.isActive) {
      return NextResponse.json(
        { error: "Collector not found or is currently deactivated." },
        { status: 404 }
      );
    }

    // Update the incident report
    const updatedReport = await prisma.incidentReport.update({
      where: { id: reportId },
      data: {
        status: "Collector Assigned",
        assignedCollectorId: collector.id,
      },
      include: {
        assignedCollector: {
          include: {
            user: true,
          },
        },
      },
    });

    // Update collector status
    await prisma.collectorProfile.update({
      where: { id: collector.id },
      data: {
        status: "On Shift",
        activeTasks: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      report: updatedReport,
      collectorName: collector.user.fullName,
      truckUnit: collector.truckUnit,
      message: `Assigned ${collector.user.fullName} (${collector.truckUnit}) to job.`,
    });
  } catch (error: any) {
    console.error("Error assigning collector:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to assign collector." },
      { status: 500 }
    );
  }
}
