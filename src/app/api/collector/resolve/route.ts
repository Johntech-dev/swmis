import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reportId, weightCollectedKg, notes } = body;

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required." }, { status: 400 });
    }

    const weight = parseFloat(weightCollectedKg) || 350;

    const report = await prisma.incidentReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    // 1. Resolve incident report
    const updatedReport = await prisma.incidentReport.update({
      where: { id: reportId },
      data: {
        status: "Resolved",
        weightCollectedKg: weight,
        completedAt: new Date(),
        description: notes
          ? `${report.description}\n\n[Field Resolution Note]: ${notes}`
          : report.description,
      },
    });

    // 2. Update collector workload and compactor load
    if (report.assignedCollectorId) {
      const collector = await prisma.collectorProfile.findUnique({
        where: { id: report.assignedCollectorId },
      });

      if (collector) {
        const addedLoadPercent = Math.round((weight / 5000) * 100);
        const newLoad = Math.min(100, (collector.compactorLoad || 0) + addedLoadPercent);
        const newTasks = Math.max(0, (collector.activeTasks || 1) - 1);

        await prisma.collectorProfile.update({
          where: { id: collector.id },
          data: {
            compactorLoad: newLoad,
            activeTasks: newTasks,
            status: newTasks === 0 ? "Available" : "On Shift",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: `Task ${updatedReport.id} completed! Logged ${weight} kg.`,
    });
  } catch (error: any) {
    console.error("Error resolving report:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to resolve report." },
      { status: 500 }
    );
  }
}
