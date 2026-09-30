import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken, setSessionCookie, SessionUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

function generateAgencyCode(prefix: string = "LCWA"): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix.toUpperCase()}-${num}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      role = "citizen",
      // Citizen fields
      neighborhood,
      address,
      phone,
      // Collector fields
      truckUnit,
      agencyCode,
      // Admin fields
      organizationName,
      organizationType,
      operatingDistrict,
    } = body;

    // 1. Basic validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(password);
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = fullName.trim();

    // 4. Role-specific creation
    if (role === "collector") {
      // Validate agency code
      if (!agencyCode) {
        return NextResponse.json(
          { error: "An authorized Agency Affiliation Code is required for collector accounts." },
          { status: 400 }
        );
      }

      const agency = await prisma.wasteAgency.findUnique({
        where: { code: agencyCode.trim().toUpperCase() },
      });

      if (!agency) {
        return NextResponse.json(
          {
            error: `Invalid Agency Code "${agencyCode}". Please obtain an authorized code from your waste authority admin.`,
          },
          { status: 400 }
        );
      }

      const generatedPlate = `LAG-${Math.floor(100 + Math.random() * 900)}-X`;
      const joinedDate = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          fullName: normalizedName,
          role: Role.COLLECTOR,
          phone: phone || null,
          collectorProfile: {
            create: {
              agencyId: agency.id,
              truckUnit: truckUnit?.trim() || "Compactor Unit #07",
              plateNumber: generatedPlate,
              status: "Available",
              compactorLoad: 0,
              activeTasks: 0,
              isActive: true,
              joinedDate,
            },
          },
        },
        include: {
          collectorProfile: {
            include: {
              agency: true,
            },
          },
        },
      });

      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: "COLLECTOR",
        phone: user.phone,
        agencyId: agency.id,
        agencyName: agency.name,
        collectorProfileId: user.collectorProfile?.id,
        truckUnit: user.collectorProfile?.truckUnit,
        plateNumber: user.collectorProfile?.plateNumber,
      };

      const token = await signSessionToken(sessionUser);
      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        user: sessionUser,
        message: `Registered as Collector attached to ${agency.name}`,
      });
    }

    if (role === "admin") {
      // Admin / Waste Agency Registration
      const agencyName = organizationName?.trim() || `${normalizedName}'s Sanitation Authority`;
      const code = generateAgencyCode("LCWA");
      const district = operatingDistrict?.trim() || "Lagos Metropolitan Corridor";

      const agency = await prisma.wasteAgency.create({
        data: {
          name: agencyName,
          code,
          district,
          phone: phone || "+234 1 800-WASTE",
          email: normalizedEmail,
          type: organizationType || "Municipal Authority",
          weeklyPickupDays: "Tuesdays & Saturdays",
        },
      });

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          fullName: normalizedName,
          role: Role.ADMIN,
          phone: phone || null,
          administeredAgencies: {
            connect: { id: agency.id },
          },
        },
      });

      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: "ADMIN",
        phone: user.phone,
        agencyId: agency.id,
        agencyName: agency.name,
      };

      const token = await signSessionToken(sessionUser);
      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        user: sessionUser,
        agencyCode: code,
        message: `Agency "${agency.name}" registered with Code ${code}`,
      });
    }

    // Default: Citizen Registration
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        fullName: normalizedName,
        role: Role.CITIZEN,
        neighborhood: neighborhood?.trim() || null,
        address: address?.trim() || null,
        phone: phone || null,
      },
    });

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: "CITIZEN",
      neighborhood: user.neighborhood,
      address: user.address,
      phone: user.phone,
    };

    const token = await signSessionToken(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: sessionUser,
      message: "Citizen account created successfully.",
    });
  } catch (error: any) {
    console.error("Sign-up error:", error);

    // Handle database connection failure specifically to give friendly instructions
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database server")) {
      return NextResponse.json(
        {
          error:
            "Database connection failed. Please ensure your Neon DATABASE_URL in .env is configured and reachable.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to process sign up. Please try again." },
      { status: 500 }
    );
  }
}
