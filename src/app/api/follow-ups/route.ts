import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { FollowUp, Lead } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { followUpCreateSchema } from "@/lib/validations/schemas";
import { transformFollowUp } from "@/lib/transformers";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") || "all";
    const priorityParam = searchParams.get("priority") || "all";
    const search = searchParams.get("search") || "";

    const query: any = { userId: authUser.userId };

    if (priorityParam !== "all") {
      query.priority = priorityParam.toUpperCase();
    }

    const followUpsDocs = await FollowUp.find(query)
      .populate({
        path: "leadId",
        select: "businessName ceoName location industry",
      })
      .sort({ scheduledAt: 1 })
      .lean();

    const allTransformed = followUpsDocs
      .filter((fu) => fu.leadId) // Ensure lead exists
      .map((fu) => transformFollowUp(fu, fu.leadId));

    // Calculate category counts
    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    for (const item of allTransformed) {
      if (item.status === "today") todayCount++;
      else if (item.status === "upcoming") upcomingCount++;
      else if (item.status === "overdue") overdueCount++;
      else if (item.status === "completed") completedCount++;
    }

    // Apply filtering by status and search
    const filtered = allTransformed.filter((item) => {
      if (statusParam !== "all" && item.status !== statusParam) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchBiz = item.businessName.toLowerCase().includes(q);
        const matchContact = item.contactPerson.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        if (!matchBiz && !matchContact && !matchNotes) return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      followUps: filtered,
      counts: {
        today: todayCount,
        upcoming: upcomingCount,
        overdue: overdueCount,
        completed: completedCount,
        all: allTransformed.length,
      },
    });
  } catch (err: any) {
    console.error("GET /api/follow-ups error:", err);
    return NextResponse.json(
      { error: "Failed to fetch follow-ups", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = followUpCreateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { leadId, channel, message, notes, scheduledAt, dueTime, priority } =
      parseResult.data;

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

    const priorityMapped = ((priority || "medium").toUpperCase() as "HIGH" | "MEDIUM" | "LOW");

    const newFollowUp: any = await FollowUp.create({
      userId: authUser.userId,
      leadId: lead._id,
      channel: channel || "email",
      message: message?.trim() || undefined,
      notes: notes?.trim() || message?.trim() || undefined,
      scheduledAt: new Date(scheduledAt),
      dueTime: dueTime || "10:00 AM",
      priority: priorityMapped,
      status: "PENDING",
    });

    const transformed = transformFollowUp(
      newFollowUp.toObject ? newFollowUp.toObject() : newFollowUp,
      (lead as any).toObject ? (lead as any).toObject() : lead
    );

    return NextResponse.json(
      {
        success: true,
        message: "Follow-up scheduled successfully.",
        followUp: transformed,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/follow-ups error:", err);
    return NextResponse.json(
      { error: "Failed to create follow-up", details: err.message },
      { status: 500 }
    );
  }
}
