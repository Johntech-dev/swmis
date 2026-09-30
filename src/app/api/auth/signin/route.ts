import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionToken, setSessionCookie, SessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query user with relevant profile & agency relations
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        collectorProfile: {
          include: {
            agency: true,
          },
        },
        administeredAgencies: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Verify password hash
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Check if collector account is deactivated
    if (user.role === "COLLECTOR") {
      if (user.collectorProfile && !user.collectorProfile.isActive) {
        return NextResponse.json(
          {
            error:
              "Access Revoked: Your collector account has been deactivated by the Agency Admin. You are no longer authorized to log in.",
          },
          { status: 403 }
        );
      }
    }

    // Prepare session payload
    const firstAdminAgency = user.administeredAgencies?.[0];
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      address: user.address,
      neighborhood: user.neighborhood,
      lga: user.lga,
      agencyId: user.collectorProfile?.agencyId || firstAdminAgency?.id || null,
      agencyName: user.collectorProfile?.agency?.name || firstAdminAgency?.name || null,
      collectorProfileId: user.collectorProfile?.id || null,
      truckUnit: user.collectorProfile?.truckUnit || null,
      plateNumber: user.collectorProfile?.plateNumber || null,
    };

    const token = await signSessionToken(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: sessionUser,
      message: `Welcome back, ${user.fullName}!`,
    });
  } catch (error: any) {
    console.error("Sign-in error:", error);

    // Database connection failure
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
      { error: error?.message || "Internal server error during sign in." },
      { status: 500 }
    );
  }
}
