import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import connectToDatabase from "@/lib/mongodb";
import { Lead, OutreachActivity, UserSettings } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { emailSendSchema } from "@/lib/validations/schemas";
import { decryptText } from "@/lib/encryption";
import { transformActivity } from "@/lib/transformers";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = emailSendSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { leadId, recipient, subject, message } = parseResult.data;

    // Validate lead ownership
    const lead = await Lead.findOne({
      _id: leadId,
      userId: authUser.userId,
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found or unauthorized" },
        { status: 404 }
      );
    }

    // Retrieve user settings with SMTP credentials
    const settings = await UserSettings.findOne({
      userId: authUser.userId,
    }).select("+smtpPassword");

    const smtpHost = settings?.smtpHost || process.env.SMTP_HOST;
    const smtpPort = settings?.smtpPort || Number(process.env.SMTP_PORT) || 587;
    const smtpUsername = settings?.smtpUsername || process.env.SMTP_USERNAME;
    let smtpPassword = "";

    if (settings?.smtpPassword) {
      smtpPassword = decryptText(settings.smtpPassword);
    } else if (process.env.SMTP_PASSWORD) {
      smtpPassword = process.env.SMTP_PASSWORD;
    }

    const fromName =
      settings?.fromName ||
      process.env.SMTP_FROM_NAME ||
      `${authUser.name} | ${authUser.agencyName || "LeadFlow"}`;
    const fromEmail =
      settings?.fromEmail ||
      process.env.SMTP_FROM_EMAIL ||
      smtpUsername ||
      authUser.email;

    if (!smtpHost || !smtpUsername || !smtpPassword) {
      return NextResponse.json(
        {
          error:
            "SMTP server configuration is incomplete. Please configure your SMTP Host, Username, and Password in Settings.",
        },
        { status: 400 }
      );
    }

    // Create Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Send the email
    const mailInfo = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipient,
      subject: subject,
      text: message,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px;">
          ${message.replace(/\n/g, "<br />")}
        </div>
      `,
    });

    // Record activity as SENT only after SMTP confirms successful sending
    const activity = await OutreachActivity.create({
      userId: authUser.userId,
      leadId: lead._id,
      channel: "EMAIL",
      recipient: recipient,
      subject: subject,
      message: message,
      status: "SENT",
      notes: `Sent via SMTP messageId: ${mailInfo.messageId}`,
    });

    // Update lead last contact and pipeline status
    lead.lastContactAt = new Date();
    if (lead.leadStatus === "NEW" || lead.leadStatus === "QUALIFIED") {
      lead.leadStatus = "CONTACTED";
    }
    await lead.save();

    return NextResponse.json({
      success: true,
      message: `Email successfully delivered to ${recipient} via SMTP.`,
      messageId: mailInfo.messageId,
      activity: transformActivity(activity.toObject()),
    });
  } catch (err: any) {
    console.error("POST /api/email/send error:", err);
    return NextResponse.json(
      {
        error: "Failed to send email through SMTP server.",
        details: err.message || "Please check your SMTP host, port, and credentials in Settings.",
      },
      { status: 502 }
    );
  }
}
