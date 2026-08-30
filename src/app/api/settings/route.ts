import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { User, UserSettings } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { settingsUpdateSchema } from "@/lib/validations/schemas";
import { encryptText } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, settings] = await Promise.all([
      User.findById(authUser.userId).lean(),
      UserSettings.findOne({ userId: authUser.userId }).lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        agencyName: user.agencyName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        timezone: user.timezone,
      },
      smtp: {
        smtpHost: settings?.smtpHost || "",
        smtpPort: settings?.smtpPort || 587,
        smtpUsername: settings?.smtpUsername || "",
        hasSmtpPassword: !!settings?.smtpPassword,
        fromName: settings?.fromName || "",
        fromEmail: settings?.fromEmail || "",
        secure: settings?.secure ?? true,
        isVerified: settings?.isVerified ?? false,
        lastTested: settings?.lastTested,
      },
    });
  } catch (err: any) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings", details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = settingsUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Update User Profile fields
    const userUpdates: any = {};
    if (data.name !== undefined) userUpdates.name = data.name.trim();
    if (data.email !== undefined) userUpdates.email = data.email.toLowerCase().trim();
    if (data.agencyName !== undefined) userUpdates.agencyName = data.agencyName.trim();
    if (data.role !== undefined) userUpdates.role = data.role.trim();
    if (data.timezone !== undefined) userUpdates.timezone = data.timezone;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(authUser.userId, { $set: userUpdates });
    }

    // Update SMTP settings
    const smtpUpdates: any = {};
    if (data.smtpHost !== undefined) smtpUpdates.smtpHost = data.smtpHost.trim();
    if (data.smtpPort !== undefined) smtpUpdates.smtpPort = data.smtpPort;
    if (data.smtpUsername !== undefined) smtpUpdates.smtpUsername = data.smtpUsername.trim();
    if (data.fromName !== undefined) smtpUpdates.fromName = data.fromName.trim();
    if (data.fromEmail !== undefined) smtpUpdates.fromEmail = data.fromEmail.trim();
    if (data.secure !== undefined) smtpUpdates.secure = data.secure;

    // If a new SMTP password is provided, securely encrypt it
    if (data.smtpPassword && data.smtpPassword.trim()) {
      smtpUpdates.smtpPassword = encryptText(data.smtpPassword.trim());
      smtpUpdates.isVerified = false; // Require re-verification
    }

    if (Object.keys(smtpUpdates).length > 0) {
      await UserSettings.findOneAndUpdate(
        { userId: authUser.userId },
        { $set: smtpUpdates },
        { upsert: true, new: true }
      );
    }

    // Fetch updated
    const [updatedUser, updatedSettings] = await Promise.all([
      User.findById(authUser.userId).lean(),
      UserSettings.findOne({ userId: authUser.userId }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully.",
      profile: {
        id: updatedUser!._id.toString(),
        name: updatedUser!.name,
        email: updatedUser!.email,
        agencyName: updatedUser!.agencyName,
        role: updatedUser!.role,
        avatarUrl: updatedUser!.avatarUrl,
        timezone: updatedUser!.timezone,
      },
      smtp: {
        smtpHost: updatedSettings?.smtpHost || "",
        smtpPort: updatedSettings?.smtpPort || 587,
        smtpUsername: updatedSettings?.smtpUsername || "",
        hasSmtpPassword: !!updatedSettings?.smtpPassword,
        fromName: updatedSettings?.fromName || "",
        fromEmail: updatedSettings?.fromEmail || "",
        secure: updatedSettings?.secure ?? true,
        isVerified: updatedSettings?.isVerified ?? false,
        lastTested: updatedSettings?.lastTested,
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/settings error:", err);
    return NextResponse.json(
      { error: "Failed to update settings", details: err.message },
      { status: 500 }
    );
  }
}
