import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Lead, OutreachActivity, FollowUp, LeadFinderBusiness } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { fromDbLeadStatus } from "@/lib/transformers";
import { getDhakaDayRange, toDhakaDateString, formatTime } from "@/lib/date-utils";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.userId;
    const userObjectId = new Types.ObjectId(userId);
    const { start: todayStart, end: todayEnd } = getDhakaDayRange();

    const followUpSentCondition: any = {
      $or: [
        { status: "COMPLETED" },
        { completedAt: { $exists: true, $ne: null } },
        { firstFollowUpSentAt: { $exists: true, $ne: null } },
        { secondFollowUpSentAt: { $exists: true, $ne: null } },
        { "history.sentAt": { $exists: true, $ne: null } },
      ],
    };

    // 1. KPI Counts - Unique clients per channel, total leads finder & total follow-ups sent
    const [
      totalLeads,
      totalLeadsFinder,
      completedFollowUpLeadIds,
      outreachFollowUpLeadIds,
      emailOutreachLeadIds,
      emailFollowUpLeadIds,
      whatsappOutreachLeadIds,
      whatsappFollowUpLeadIds,
      linkedinOutreachLeadIds,
      linkedinFollowUpLeadIds,
      twitterOutreachLeadIds,
      twitterFollowUpLeadIds,
      instagramOutreachLeadIds,
      instagramFollowUpLeadIds,
      facebookOutreachLeadIds,
      facebookFollowUpLeadIds,
      emailsSent,
      whatsappPrepared,
      repliesCount,
      pendingFollowUps,
      todayFollowUps,
    ] = await Promise.all([
      Lead.countDocuments({ userId }),
      LeadFinderBusiness.countDocuments({ userId }),
      FollowUp.distinct("leadId", { userId, ...followUpSentCondition } as any),
      OutreachActivity.distinct("leadId", {
        userId,
        followUpNumber: { $in: [1, 2] },
        status: { $nin: ["DRAFT", "FAILED"] },
      }),
      OutreachActivity.distinct("leadId", {
        userId,
        channel: "EMAIL",
        status: { $nin: ["DRAFT", "FAILED"] },
      }),
      FollowUp.distinct("leadId", { userId, channel: "email", ...followUpSentCondition } as any),
      OutreachActivity.distinct("leadId", {
        userId,
        channel: "WHATSAPP",
        status: { $nin: ["DRAFT", "FAILED"] },
      }),
      FollowUp.distinct("leadId", { userId, channel: "whatsapp", ...followUpSentCondition } as any),
      OutreachActivity.distinct("leadId", {
        userId,
        channel: "LINKEDIN",
        status: { $nin: ["DRAFT", "FAILED"] },
      }),
      FollowUp.distinct("leadId", { userId, channel: "linkedin", ...followUpSentCondition } as any),
      OutreachActivity.distinct("leadId", {
        userId,
        channel: "TWITTER",
        status: { $nin: ["DRAFT", "FAILED"] },
      }),
      FollowUp.distinct("leadId", {
        userId,
        channel: "twitter",
        ...followUpSentCondition,
      } as any),
      OutreachActivity.distinct("leadId", {
        userId,
        channel: "INSTAGRAM",
        status: { $nin: ["DRAFT", "FAILED"] },
      }),
      FollowUp.distinct("leadId", { userId, channel: "instagram", ...followUpSentCondition } as any),
      OutreachActivity.distinct("leadId", {
        userId,
        channel: "FACEBOOK",
        status: { $nin: ["DRAFT", "FAILED"] },
      }),
      FollowUp.distinct("leadId", { userId, channel: "facebook", ...followUpSentCondition } as any),
      OutreachActivity.countDocuments({ userId, channel: "EMAIL", status: "SENT" }),
      OutreachActivity.countDocuments({ userId, channel: "WHATSAPP" }),
      Lead.countDocuments({ userId, leadStatus: "REPLIED" }),
      FollowUp.countDocuments({ userId, status: "PENDING" }),
      FollowUp.countDocuments({
        userId,
        status: "PENDING",
        scheduledAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }),
    ]);

    const emailCount = new Set([
      ...emailOutreachLeadIds.map((id) => id.toString()),
      ...emailFollowUpLeadIds.map((id) => id.toString()),
    ]).size;

    const whatsappCount = new Set([
      ...whatsappOutreachLeadIds.map((id) => id.toString()),
      ...whatsappFollowUpLeadIds.map((id) => id.toString()),
    ]).size;

    const linkedinCount = new Set([
      ...linkedinOutreachLeadIds.map((id) => id.toString()),
      ...linkedinFollowUpLeadIds.map((id) => id.toString()),
    ]).size;

    const twitterCount = new Set([
      ...twitterOutreachLeadIds.map((id) => id.toString()),
      ...twitterFollowUpLeadIds.map((id) => id.toString()),
    ]).size;

    const instagramCount = new Set([
      ...instagramOutreachLeadIds.map((id) => id.toString()),
      ...instagramFollowUpLeadIds.map((id) => id.toString()),
    ]).size;

    const facebookCount = new Set([
      ...facebookOutreachLeadIds.map((id) => id.toString()),
      ...facebookFollowUpLeadIds.map((id) => id.toString()),
    ]).size;

    // Requirement 3: Count unique people/leads who actually received at least one follow-up
    const totalFollowUpsSent = new Set([
      ...completedFollowUpLeadIds.map((id) => id.toString()),
      ...outreachFollowUpLeadIds.map((id) => id.toString()),
    ]).size;

    // 2. Pipeline breakdown aggregation
    const pipelineAggregation = await Lead.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$leadStatus", count: { $sum: 1 } } },
    ]);

    const pipelineCounts: Record<string, number> = {
      New: 0,
      Qualified: 0,
      Contacted: 0,
      Replied: 0,
      Interested: 0,
      "Follow-up": 0,
      Meeting: 0,
      Proposal: 0,
      Won: 0,
      Lost: 0,
    };

    for (const item of pipelineAggregation) {
      const stageName = fromDbLeadStatus(item._id);
      pipelineCounts[stageName] = item.count;
    }

    // 3. Top Niches aggregation
    const nichesAggregation = await Lead.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$industry", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const topNiches = nichesAggregation.map((n) => ({
      name: n._id || "Other",
      count: n.count,
      percentage: totalLeads > 0 ? Math.round((n.count / totalLeads) * 100) : 0,
    }));

    // 4. Recent Activities
    const recentActivitiesDocs = await OutreachActivity.find({ userId })
      .populate({
        path: "leadId",
        select: "businessName ceoName location",
      })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const recentActivities = recentActivitiesDocs.map((act) => {
      const leadInfo = act.leadId as any;
      return {
        id: act._id.toString(),
        leadId: leadInfo?._id ? leadInfo._id.toString() : "",
        businessName: leadInfo?.businessName || "Unknown Lead",
        ceoName: leadInfo?.ceoName || undefined,
        channel: (act.channel || "EMAIL").toLowerCase(),
        type:
          act.status === "SENT"
            ? `${act.channel} outreach sent`
            : act.status === "PREPARED"
            ? `${act.channel} message prepared`
            : act.notes || `${act.channel} activity`,
        date: toDhakaDateString(act.createdAt),
        time: formatTime(act.createdAt),
        messagePreview: act.message
          ? act.message.substring(0, 100) + (act.message.length > 100 ? "..." : "")
          : undefined,
        status: act.status === "SENT" ? "Sent" : "Delivered",
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalLeads,
        totalLeadsFinder,
        totalFollowUpsSent,
        emailCount,
        whatsappCount,
        linkedinCount,
        twitterCount,
        instagramCount,
        facebookCount,
        emailsSent,
        whatsappPrepared,
        replies: repliesCount,
        emailOpenRate: null,
        pendingFollowUps,
        todayFollowUps,
        pipeline: pipelineCounts,
        topNiches,
        recentActivities,
      },
    });
  } catch (err: any) {
    console.error("GET /api/dashboard/stats error:", err);
    return NextResponse.json(
      { error: "Failed to calculate dashboard statistics", details: err.message },
      { status: 500 }
    );
  }
}
