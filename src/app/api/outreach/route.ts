import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead, OutreachActivity, FollowUp } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { outreachCreateSchema } from "@/lib/validations/schemas";
import { transformActivity, formatEnglishDate } from "@/lib/transformers";

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

    const {
      leadId,
      channel,
      recipient,
      subject,
      message,
      status,
      notes,
      senderEmail,
      outreachType,
      templateCategory,
      templateName,
      followUpNumber,
      intervalDays,
    } = parseResult.data;

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

    const chLower = (channel || "email").toLowerCase();
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
      senderEmail: senderEmail?.trim() || undefined,
      outreachType: outreachType?.trim() || undefined,
      templateCategory: templateCategory?.trim() || outreachType?.trim() || undefined,
      templateName: templateName?.trim() || undefined,
      followUpNumber: followUpNumber || undefined,
      intervalDays: intervalDays || undefined,
    });

    // Advance platform-specific follow-up cadence if this is a follow-up
    if (followUpNumber) {
      const activeFollowUp = await FollowUp.findOne({
        userId: authUser.userId,
        leadId: lead._id,
        channel: chLower,
        status: { $ne: "COMPLETED" },
      });

      if (activeFollowUp) {
        const now = new Date();
        const todayDateStr = now.toISOString().split("T")[0];
        const interval = activeFollowUp.intervalDays || intervalDays || 3;

        if (followUpNumber === 1 || activeFollowUp.currentStep === 1) {
          activeFollowUp.firstFollowUpSentAt = now;
          const schedDateStr = activeFollowUp.firstFollowUpScheduledAt
            ? activeFollowUp.firstFollowUpScheduledAt.toISOString().split("T")[0]
            : activeFollowUp.scheduledAt.toISOString().split("T")[0];

          activeFollowUp.history.push({
            followUpNumber: 1,
            scheduledDate: schedDateStr,
            sentAt: now,
            sentDate: todayDateStr,
            channel: chLower,
            templateCategory: templateCategory || outreachType || activeFollowUp.templateCategory,
            templateName: templateName || activeFollowUp.templateName,
            subject: subject || activeFollowUp.subject,
            messagePreview: message.substring(0, 100),
            notes: notes || "1st Follow-up sent",
          });

          // Calculate 2nd follow-up from ACTUAL 1st follow-up send date
          const nextDueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
          activeFollowUp.secondFollowUpScheduledAt = nextDueDate;
          activeFollowUp.scheduledAt = nextDueDate;
          activeFollowUp.currentStep = 2;

          // Check if 1st follow-up was overdue
          if (activeFollowUp.firstFollowUpScheduledAt && now > activeFollowUp.firstFollowUpScheduledAt) {
            activeFollowUp.isRescheduled = true;
            activeFollowUp.rescheduleNotice = `Rescheduled: You need to send the 2nd follow-up on ${formatEnglishDate(nextDueDate)}.`;
          }

          await activeFollowUp.save();
        } else if (followUpNumber === 2 || activeFollowUp.currentStep === 2) {
          activeFollowUp.secondFollowUpSentAt = now;
          const schedDateStr = activeFollowUp.secondFollowUpScheduledAt
            ? activeFollowUp.secondFollowUpScheduledAt.toISOString().split("T")[0]
            : activeFollowUp.scheduledAt.toISOString().split("T")[0];

          activeFollowUp.history.push({
            followUpNumber: 2,
            scheduledDate: schedDateStr,
            sentAt: now,
            sentDate: todayDateStr,
            channel: chLower,
            templateCategory: templateCategory || outreachType || activeFollowUp.templateCategory,
            templateName: templateName || activeFollowUp.templateName,
            subject: subject || activeFollowUp.subject,
            messagePreview: message.substring(0, 100),
            notes: notes || "2nd Follow-up sent",
          });

          // Maximum 2 follow-ups reached -> COMPLETED
          activeFollowUp.currentStep = 3;
          activeFollowUp.status = "COMPLETED";
          activeFollowUp.completedAt = now;

          await activeFollowUp.save();
        }
      }
    }

    // Update lead lastContactAt and status
    lead.lastContactAt = new Date();
    if (lead.leadStatus === "NEW" || lead.leadStatus === "QUALIFIED") {
      lead.leadStatus = "CONTACTED";
    }

    // Preserve original sender Gmail and outreach type from the first outreach
    if (senderEmail?.trim() && !lead.originalSenderEmail) {
      lead.originalSenderEmail = senderEmail.trim();
    }
    if (outreachType?.trim() && !lead.originalOutreachType) {
      lead.originalOutreachType = outreachType.trim();
    }

    await lead.save();

    return NextResponse.json({
      success: true,
      message: "Outreach activity saved successfully.",
      activity: transformActivity(activity.toObject ? activity.toObject() : activity),
      lead: {
        id: lead._id.toString(),
        email: lead.email,
        originalSenderEmail: lead.originalSenderEmail,
        originalOutreachType: lead.originalOutreachType,
        status: lead.leadStatus,
        lastContact: lead.lastContactAt?.toISOString().split("T")[0],
      },
    });
  } catch (err: any) {
    console.error("POST /api/outreach error:", err);
    return NextResponse.json(
      { error: "Failed to record outreach activity", details: err.message },
      { status: 500 }
    );
  }
}
