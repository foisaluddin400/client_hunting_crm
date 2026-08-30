import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import connectToDatabase from "@/lib/mongodb";
import { UserSettings } from "@/lib/models/UserSettings";
import { getAuthUser } from "@/lib/auth";
import { decryptText, encryptText } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // Check if test config was passed directly in body, or fetch from saved settings
    const settings = await UserSettings.findOne({
      userId: authUser.userId,
    }).select("+smtpPassword");

    const smtpHost = body.smtpHost || settings?.smtpHost || process.env.SMTP_HOST;
    const smtpPort = body.smtpPort || settings?.smtpPort || Number(process.env.SMTP_PORT) || 587;
    const smtpUsername = body.smtpUsername || settings?.smtpUsername || process.env.SMTP_USERNAME;

    let smtpPassword = "";
    if (body.smtpPassword && body.smtpPassword.trim()) {
      smtpPassword = body.smtpPassword.trim();
    } else if (settings?.smtpPassword) {
      smtpPassword = decryptText(settings.smtpPassword);
    } else if (process.env.SMTP_PASSWORD) {
      smtpPassword = process.env.SMTP_PASSWORD;
    }

    if (!smtpHost || !smtpUsername || !smtpPassword) {
      return NextResponse.json(
        {
          error:
            "Missing SMTP Host, Username, or Password. Please provide all fields before testing.",
        },
        { status: 400 }
      );
    }

    // Create transporter and verify
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();

    // If verified, update status in UserSettings
    const updates: any = {
      isVerified: true,
      lastTested: new Date(),
    };
    if (body.smtpHost) updates.smtpHost = body.smtpHost;
    if (body.smtpPort) updates.smtpPort = body.smtpPort;
    if (body.smtpUsername) updates.smtpUsername = body.smtpUsername;
    if (body.smtpPassword) updates.smtpPassword = encryptText(body.smtpPassword);

    await UserSettings.findOneAndUpdate(
      { userId: authUser.userId },
      { $set: updates },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "SMTP connection verified successfully! Ready for outbound email.",
      lastTested: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("SMTP Test failed:", err);
    return NextResponse.json(
      {
        error: "SMTP connection failed.",
        details: err.message || "Invalid host, port, or credentials.",
      },
      { status: 400 }
    );
  }
}
