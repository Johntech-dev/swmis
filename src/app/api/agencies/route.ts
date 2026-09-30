import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const agencies = await prisma.wasteAgency.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        district: true,
        phone: true,
        email: true,
        type: true,
        weeklyPickupDays: true,
      },
    });

    return NextResponse.json({ agencies });
  } catch (error: any) {
    console.error("Error fetching agencies:", error);
    return NextResponse.json(
      { error: error?.message || "Could not fetch agencies from database." },
      { status: 500 }
    );
  }
}
