import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Lead, OutreachActivity, FollowUp, LeadFinderBusiness } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { fromDbLeadStatus } from "@/lib/transformers";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.userId;
    const userObjectId = new Types.ObjectId(userId);

    // 1. KPI Counts - Unique clients per channel, total leads finder & total follow-ups sent
    const [
      totalLeads,
      totalLeadsFinder,
      completedFollowUpsCount,
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
      FollowUp.countDocuments({ userId, status: "COMPLETED" }),
      OutreachActivity.distinct("leadId", { userId, channel: "EMAIL" }),
      FollowUp.distinct("leadId", { userId, channel: "email" }),
      OutreachActivity.distinct("leadId", { userId, channel: "WHATSAPP" }),
      FollowUp.distinct("leadId", { userId, channel: "whatsapp" }),
      OutreachActivity.distinct("leadId", { userId, channel: "LINKEDIN" }),
      FollowUp.distinct("leadId", { userId, channel: "linkedin" }),
      OutreachActivity.distinct("leadId", {
        userId,
        channel: "TWITTER",
      }),
      FollowUp.distinct("leadId", {
        userId,
        channel: "twitter",
      }),
      OutreachActivity.distinct("leadId", { userId, channel: "INSTAGRAM" }),
      FollowUp.distinct("leadId", { userId, channel: "instagram" }),
      OutreachActivity.distinct("leadId", { userId, channel: "FACEBOOK" }),
      FollowUp.distinct("leadId", { userId, channel: "facebook" }),
      OutreachActivity.countDocuments({ userId, channel: "EMAIL", status: "SENT" }),
      OutreachActivity.countDocuments({ userId, channel: "WHATSAPP" }),
      Lead.countDocuments({ userId, leadStatus: "REPLIED" }),
      FollowUp.countDocuments({ userId, status: "PENDING" }),
      FollowUp.countDocuments({
        userId,
        status: "PENDING",
        scheduledAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
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

    // Requirement 16: Count actual follow-up actions/records completed from the Follow-up system
    const totalFollowUpsSent = completedFollowUpsCount;

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
        date: new Date(act.createdAt).toISOString().split("T")[0],
        time: new Date(act.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
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
