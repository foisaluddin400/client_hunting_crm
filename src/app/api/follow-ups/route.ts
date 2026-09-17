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
    const channelParam = (searchParams.get("channel") || searchParams.get("platform") || "all").toLowerCase();
    const search = searchParams.get("search") || "";

    const query: any = { userId: authUser.userId };

    if (priorityParam !== "all") {
      query.priority = priorityParam.toUpperCase();
    }

    if (channelParam !== "all") {
      query.channel = channelParam;
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
        const matchTemplate = item.templateName?.toLowerCase().includes(q);
        const matchSubject = item.subject?.toLowerCase().includes(q);
        if (!matchBiz && !matchContact && !matchNotes && !matchTemplate && !matchSubject) return false;
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

    const {
      leadId,
      channel,
      message,
      notes,
      scheduledAt,
      dueTime,
      priority,
      intervalDays,
      currentStep,
      originalMessageDate,
      templateCategory,
      templateName,
      subject,
    } = parseResult.data;

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
    const priorityMapped = ((priority || "medium").toUpperCase() as "HIGH" | "MEDIUM" | "LOW");
    const schedDate = new Date(scheduledAt);

    // Upsert or create platform-specific follow-up
    let followUp = await FollowUp.findOne({
      userId: authUser.userId,
      leadId: lead._id,
      channel: chLower,
      status: { $ne: "COMPLETED" },
    });

    if (followUp) {
      followUp.scheduledAt = schedDate;
      followUp.firstFollowUpScheduledAt = schedDate;
      followUp.dueTime = dueTime || "10:00 AM";
      followUp.priority = priorityMapped;
      followUp.intervalDays = intervalDays || 3;
      followUp.currentStep = currentStep || 1;
      if (message) followUp.message = message.trim();
      if (notes) followUp.notes = notes.trim();
      if (originalMessageDate) followUp.originalMessageDate = new Date(originalMessageDate);
      if (templateCategory) followUp.templateCategory = templateCategory.trim();
      if (templateName) followUp.templateName = templateName.trim();
      if (subject) followUp.subject = subject.trim();
      await followUp.save();
    } else {
      followUp = await FollowUp.create({
        userId: authUser.userId,
        leadId: lead._id,
        channel: chLower,
        message: message?.trim() || undefined,
        notes: notes?.trim() || message?.trim() || undefined,
        scheduledAt: schedDate,
        firstFollowUpScheduledAt: schedDate,
        dueTime: dueTime || "10:00 AM",
        priority: priorityMapped,
        status: "PENDING",
        intervalDays: intervalDays || 3,
        currentStep: currentStep || 1,
        originalMessageDate: originalMessageDate ? new Date(originalMessageDate) : new Date(),
        originalMessagePreview: message?.substring(0, 100) || undefined,
        templateCategory: templateCategory?.trim() || undefined,
        templateName: templateName?.trim() || undefined,
        subject: subject?.trim() || undefined,
        history: [],
      });
    }

    const transformed = transformFollowUp(
      followUp.toObject ? followUp.toObject() : followUp,
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
