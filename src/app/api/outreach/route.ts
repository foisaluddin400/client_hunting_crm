import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead, OutreachActivity } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { outreachCreateSchema } from "@/lib/validations/schemas";
import { transformActivity } from "@/lib/transformers";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = outreachCreateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { leadId, channel, recipient, subject, message, status, notes } =
      parseResult.data;

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

    const chUpper = (channel || "EMAIL").toUpperCase() as any;
    const stUpper = (status || "PREPARED").toUpperCase() as any;

    // Create activity
    const activity: any = await OutreachActivity.create({
      userId: authUser.userId,
      leadId: lead._id,
      channel: chUpper,
      recipient: recipient?.trim() || undefined,
      subject: subject?.trim() || undefined,
      message: message.trim(),
      status: stUpper,
      notes: notes?.trim() || undefined,
    });

    // Update lead lastContactAt and status
    lead.lastContactAt = new Date();
    if (lead.leadStatus === "NEW" || lead.leadStatus === "QUALIFIED") {
      lead.leadStatus = "CONTACTED";
    }
    await lead.save();

    return NextResponse.json({
      success: true,
      message: "Outreach activity saved successfully.",
      activity: transformActivity(activity.toObject ? activity.toObject() : activity),
    });
  } catch (err: any) {
    console.error("POST /api/outreach error:", err);
    return NextResponse.json(
      { error: "Failed to record outreach activity", details: err.message },
      { status: 500 }
    );
  }
}
