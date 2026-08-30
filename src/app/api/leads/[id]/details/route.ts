import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead, OutreachActivity, FollowUp } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import {
  transformLead,
  transformActivity,
  transformFollowUp,
} from "@/lib/transformers";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Strict user scoping
    const leadDoc = await Lead.findOne({
      _id: id,
      userId: authUser.userId,
    }).lean();

    if (!leadDoc) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const [activitiesDocs, followUpsDocs] = await Promise.all([
      OutreachActivity.find({
        userId: authUser.userId,
        leadId: id,
      })
        .sort({ createdAt: -1 })
        .lean(),
      FollowUp.find({
        userId: authUser.userId,
        leadId: id,
      })
        .sort({ scheduledAt: 1 })
        .lean(),
    ]);

    const transformedLead = transformLead(leadDoc, activitiesDocs);
    const transformedActivities = activitiesDocs.map(transformActivity);
    const transformedFollowUps = followUpsDocs.map((fu) =>
      transformFollowUp(fu, leadDoc)
    );

    return NextResponse.json({
      success: true,
      lead: transformedLead,
      activities: transformedActivities,
      followUps: transformedFollowUps,
      notes: leadDoc.notes || "",
    });
  } catch (err: any) {
    console.error("GET /api/leads/[id]/details error:", err);
    return NextResponse.json(
      { error: "Failed to fetch lead details", details: err.message },
      { status: 500 }
    );
  }
}
