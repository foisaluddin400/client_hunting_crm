import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead, OutreachActivity } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { leadCreateSchema } from "@/lib/validations/schemas";
import {
  toDbWebsiteStatus,
  toDbLeadStatus,
  transformLead,
} from "@/lib/transformers";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const businessName = searchParams.get("businessName") || "";
    const ceoName = searchParams.get("ceoName") || "";
    const location = searchParams.get("location") || "";
    const websiteStatus = searchParams.get("websiteStatus") || "";
    const leadStatus = searchParams.get("leadStatus") || searchParams.get("status") || "";
    const industry = searchParams.get("industry") || searchParams.get("niche") || "";
    const channel = searchParams.get("channel") || "";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    // Strict user scoping
    const query: any = { userId: authUser.userId };

    // General Search
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { businessName: searchRegex },
        { ceoName: searchRegex },
        { email: searchRegex },
        { location: searchRegex },
        { industry: searchRegex },
      ];
    }

    if (businessName.trim()) {
      query.businessName = new RegExp(businessName.trim(), "i");
    }

    if (ceoName.trim()) {
      query.ceoName = new RegExp(ceoName.trim(), "i");
    }

    if (location.trim()) {
      query.location = new RegExp(location.trim(), "i");
    }

    if (websiteStatus && websiteStatus !== "all") {
      query.websiteStatus = toDbWebsiteStatus(websiteStatus);
    }

    if (leadStatus && leadStatus !== "all") {
      query.leadStatus = toDbLeadStatus(leadStatus);
    }

    if (industry && industry !== "all") {
      query.industry = new RegExp(`^${industry.trim()}$`, "i");
    }

    if (channel && channel !== "all") {
      const ch = channel.toLowerCase();
      if (ch === "email") query.email = { $exists: true, $ne: "" };
      else if (ch === "whatsapp") query.$or = [{ whatsapp: { $exists: true, $ne: "" } }, { phone: { $exists: true, $ne: "" } }];
      else if (ch === "linkedin") query.linkedin = { $exists: true, $ne: "" };
      else if (ch === "instagram") query.instagram = { $exists: true, $ne: "" };
      else if (ch === "facebook") query.facebook = { $exists: true, $ne: "" };
      else if (ch === "twitter") query.twitter = { $exists: true, $ne: "" };
    }

    const total = await Lead.countDocuments(query);
    const leadsDocs = await Lead.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Fetch activities for these leads
    const leadIds = leadsDocs.map((l) => l._id);
    const activitiesDocs = await OutreachActivity.find({
      userId: authUser.userId,
      leadId: { $in: leadIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Group activities by leadId
    const activitiesByLead = new Map<string, any[]>();
    for (const act of activitiesDocs) {
      const lid = act.leadId.toString();
      if (!activitiesByLead.has(lid)) {
        activitiesByLead.set(lid, []);
      }
      activitiesByLead.get(lid)!.push(act);
    }

    const transformedLeads = leadsDocs.map((doc) => {
      const acts = activitiesByLead.get(doc._id.toString()) || [];
      return transformLead(doc, acts);
    });

    return NextResponse.json({
      success: true,
      leads: transformedLeads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    console.error("GET /api/leads error:", err);
    return NextResponse.json(
      { error: "Failed to fetch leads", details: err.message },
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
    const parseResult = leadCreateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    const newLeadDoc = await Lead.create({
      userId: authUser.userId,
      businessName: data.businessName.trim(),
      ceoName: data.ceoName?.trim() || undefined,
      industry: data.industry?.trim() || data.niche?.trim() || "Restaurants",
      location: data.location.trim(),
      website: data.website?.trim() || undefined,
      websiteStatus: toDbWebsiteStatus(data.websiteStatus),
      email: data.email?.trim() || undefined,
      whatsapp: data.whatsapp?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      linkedin: data.linkedin?.trim() || undefined,
      instagram: data.instagram?.trim() || undefined,
      facebook: data.facebook?.trim() || undefined,
      twitter: data.twitter?.trim() || undefined,
      leadStatus: toDbLeadStatus(data.leadStatus || data.status),
      leadScore: data.leadScore ?? 75,
      notes: data.notes?.trim() || undefined,
      avatarColor: data.avatarColor || "bg-indigo-600",
    });

    // Auto-create initial activity log
    const initialActivity = await OutreachActivity.create({
      userId: authUser.userId,
      leadId: newLeadDoc._id,
      channel: "SYSTEM",
      message: `Lead '${newLeadDoc.businessName}' added to CRM pipeline.`,
      status: "COMPLETED",
    });

    const transformed = transformLead(newLeadDoc.toObject(), [initialActivity.toObject()]);

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully.",
        lead: transformed,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/leads error:", err);
    return NextResponse.json(
      { error: "Failed to create lead", details: err.message },
      { status: 500 }
    );
  }
}
