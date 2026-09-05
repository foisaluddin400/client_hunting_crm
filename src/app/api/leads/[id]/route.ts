import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead, OutreachActivity, FollowUp, LeadFinderBusiness } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { leadUpdateSchema } from "@/lib/validations/schemas";
import {
  toDbWebsiteStatus,
  toDbLeadStatus,
  transformLead,
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

    const activities = await OutreachActivity.find({
      userId: authUser.userId,
      leadId: id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      lead: transformLead(leadDoc, activities),
    });
  } catch (err: any) {
    console.error("GET /api/leads/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch lead", details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await req.json();

    const parseResult = leadUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const updateFields: any = {};

    if (data.businessName !== undefined) updateFields.businessName = data.businessName.trim();
    if (data.ceoName !== undefined) updateFields.ceoName = data.ceoName.trim();
    if (data.industry !== undefined) updateFields.industry = data.industry.trim();
    if (data.niche !== undefined) updateFields.industry = data.niche.trim();
    if (data.location !== undefined) updateFields.location = data.location.trim();
    if (data.website !== undefined) updateFields.website = data.website.trim();
    if (data.websiteStatus !== undefined) updateFields.websiteStatus = toDbWebsiteStatus(data.websiteStatus);
    if (data.email !== undefined) updateFields.email = data.email.trim();
    if (data.whatsapp !== undefined) updateFields.whatsapp = data.whatsapp.trim();
    if (data.phone !== undefined) updateFields.phone = data.phone.trim();
    if (data.linkedin !== undefined) updateFields.linkedin = data.linkedin.trim();
    if (data.instagram !== undefined) updateFields.instagram = data.instagram.trim();
    if (data.facebook !== undefined) updateFields.facebook = data.facebook.trim();
    if (data.twitter !== undefined) updateFields.twitter = data.twitter.trim();
    if (data.leadStatus !== undefined) updateFields.leadStatus = toDbLeadStatus(data.leadStatus);
    if (data.status !== undefined) updateFields.leadStatus = toDbLeadStatus(data.status);
    if (data.leadScore !== undefined) updateFields.leadScore = data.leadScore;
    if (data.notes !== undefined) updateFields.notes = data.notes.trim();
    if (data.avatarColor !== undefined) updateFields.avatarColor = data.avatarColor;

    const updatedLead = await Lead.findOneAndUpdate(
      { _id: id, userId: authUser.userId },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updatedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Synchronize updates back to linked LeadFinderBusiness if exists
    const finderUpdates: any = {};
    if (updateFields.businessName) finderUpdates.businessName = updateFields.businessName;
    if (updateFields.industry) finderUpdates.businessCategory = updateFields.industry;
    if (updateFields.location) finderUpdates.fullAddress = updateFields.location;
    if (updateFields.phone !== undefined) finderUpdates.phone = updateFields.phone;
    if (updateFields.email !== undefined) finderUpdates.email = updateFields.email;
    if (updateFields.whatsapp !== undefined) finderUpdates.whatsapp = updateFields.whatsapp;
    if (updateFields.facebook !== undefined) finderUpdates.facebook = updateFields.facebook;
    if (updateFields.instagram !== undefined) finderUpdates.instagram = updateFields.instagram;
    if (updateFields.linkedin !== undefined) finderUpdates.linkedin = updateFields.linkedin;
    if (updateFields.twitter !== undefined) finderUpdates.twitter = updateFields.twitter;
    if (updateFields.website !== undefined) finderUpdates.website = updateFields.website;

    if (Object.keys(finderUpdates).length > 0) {
      const finderQueryOr: any[] = [{ leadId: updatedLead._id }];
      if (updatedLead.finderBusinessId) {
        finderQueryOr.push({ _id: updatedLead.finderBusinessId });
      }
      await LeadFinderBusiness.updateOne(
        { $or: finderQueryOr, userId: authUser.userId },
        { $set: { ...finderUpdates, leadId: updatedLead._id, isConfirmed: true } }
      ).catch((e) => console.error("Lead to Finder sync error:", e));
    }

    const activities = await OutreachActivity.find({
      userId: authUser.userId,
      leadId: id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully.",
      lead: transformLead(updatedLead, activities),
    });
  } catch (err: any) {
    console.error("PATCH /api/leads/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update lead", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const deletedLead = await Lead.findOneAndDelete({
      _id: id,
      userId: authUser.userId,
    });

    if (!deletedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Cascade delete activities and follow-ups for this lead
    await OutreachActivity.deleteMany({
      leadId: id,
      userId: authUser.userId,
    });

    await FollowUp.deleteMany({
      leadId: id,
      userId: authUser.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Lead '${deletedLead.businessName}' and associated history removed.`,
    });
  } catch (err: any) {
    console.error("DELETE /api/leads/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete lead", details: err.message },
      { status: 500 }
    );
  }
}
