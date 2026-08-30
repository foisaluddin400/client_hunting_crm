import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { User, UserSettings } from "@/lib/models";
import { getAuthUser, signToken, AUTH_COOKIE_NAME, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json(
        { authenticated: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Authenticated user exists
    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: "User not found" },
        { status: 401 }
      );
    }

    const userSettings = await UserSettings.findOne({ userId: user._id });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        agencyName: user.agencyName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        timezone: user.timezone,
      },
      settings: {
        smtpHost: userSettings?.smtpHost || "",
        smtpPort: userSettings?.smtpPort || 587,
        smtpUsername: userSettings?.smtpUsername || "",
        hasSmtpPassword: !!userSettings?.smtpPassword,
        fromName: userSettings?.fromName || "",
        fromEmail: userSettings?.fromEmail || "",
        secure: userSettings?.secure ?? true,
        isVerified: userSettings?.isVerified ?? false,
        lastTested: userSettings?.lastTested,
        businessCategories: userSettings?.businessCategories,
        targetCountries: userSettings?.targetCountries,
      },
    });
  } catch (err: any) {
    console.error("Auth me error:", err);
    return NextResponse.json(
      { error: "Failed to get auth status", details: err.message },
      { status: 500 }
    );
  }
}
