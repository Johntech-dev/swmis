import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reportId, step } = body; // step: "en-route" | "arrived"

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required." }, { status: 400 });
    }

    const updated = await prisma.incidentReport.update({
      where: { id: reportId },
      data: {
        status: "In-Progress",
      },
    });

    return NextResponse.json({
      success: true,
      report: updated,
      message: step === "en-route" ? "Route GPS started." : "Marked arrived at location.",
    });
  } catch (error: any) {
    console.error("Error updating report step:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update status." },
      { status: 500 }
    );
  }
}
