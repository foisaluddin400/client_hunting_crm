import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { LeadFinderBusiness, Lead, OutreachActivity } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { transformLeadFinderBusiness } from "@/lib/transformers";
import { isDuplicateBusiness } from "@/lib/duplicate-detector";

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

    const userId = authUser.userId;
    const { id } = await context.params;
    const body = await req.json();

    const finderDoc = await LeadFinderBusiness.findOne({ _id: id, userId });
    if (!finderDoc) {
      return NextResponse.json(
        { error: "Lead Finder business not found or unauthorized" },
        { status: 404 }
      );
    }

    // 1. Handle Selection / Checkbox toggle
    if (typeof body.isSelected === "boolean") {
      const wantSelect = body.isSelected;

      if (wantSelect) {
        // Select / Confirm into Leads
        if (!finderDoc.leadId) {
          const leadWhatsapp = finderDoc.whatsapp || finderDoc.phone || undefined;
          const leadPhone = finderDoc.phone || finderDoc.whatsapp || undefined;

          // Check if lead already exists for this finder business
          let linkedLead = await Lead.findOne({
            $or: [{ finderBusinessId: finderDoc._id }, ...(finderDoc.leadId ? [{ _id: finderDoc.leadId }] : [])],
            userId,
          });

          if (!linkedLead) {
            linkedLead = await Lead.create({
              userId,
              businessName: finderDoc.businessName,
              industry: finderDoc.businessCategory || "Other",
              location: finderDoc.fullAddress || "Not specified",
              website: finderDoc.website || undefined,
              websiteStatus: finderDoc.website ? "OTHER" : "NO_WEBSITE",
              email: finderDoc.email || undefined,
              phone: leadPhone,
              whatsapp: leadWhatsapp,
              facebook: finderDoc.facebook || undefined,
              instagram: finderDoc.instagram || undefined,
              linkedin: finderDoc.linkedin || undefined,
              twitter: finderDoc.twitter || undefined,
              leadStatus: "NEW",
              leadScore: 75,
              notes: `Imported via Google Maps Lead Scraper (${finderDoc.googleMapsUrl || ""})`,
              finderBusinessId: finderDoc._id,
              foundAt: finderDoc.foundAt || new Date(),
            });
          } else {
            linkedLead.businessName = finderDoc.businessName;
            if (finderDoc.businessCategory) linkedLead.industry = finderDoc.businessCategory;
            if (finderDoc.fullAddress) linkedLead.location = finderDoc.fullAddress;
            if (finderDoc.email) linkedLead.email = finderDoc.email;
            if (leadWhatsapp) linkedLead.whatsapp = leadWhatsapp;
            if (leadPhone) linkedLead.phone = leadPhone;
            if (finderDoc.facebook) linkedLead.facebook = finderDoc.facebook;
            if (finderDoc.instagram) linkedLead.instagram = finderDoc.instagram;
            if (finderDoc.linkedin) linkedLead.linkedin = finderDoc.linkedin;
            if (finderDoc.twitter) linkedLead.twitter = finderDoc.twitter;
            if (finderDoc.website) {
              linkedLead.website = finderDoc.website;
              linkedLead.websiteStatus = "OTHER";
            }
            await linkedLead.save();
          }

          finderDoc.leadId = linkedLead._id as any;
        }

        finderDoc.isConfirmed = true;
        await finderDoc.save();

        return NextResponse.json({
          success: true,
          message: "Business confirmed to Leads.",
          business: transformLeadFinderBusiness(finderDoc, "NEW"),
        });
      } else {
        // Uncheck / Remove from Leads (MUST CHECK CONNECTED LEAD RULE)
        if (finderDoc.leadId) {
          const linkedLead = await Lead.findOne({
            _id: finderDoc.leadId,
            userId,
          });

          if (linkedLead) {
            // Check if lead has outreach activity or is in connected status
            const activityCount = await OutreachActivity.countDocuments({
              leadId: linkedLead._id,
              userId,
            });

            const isConnected =
              activityCount > 0 ||
              linkedLead.leadStatus === "CONNECTED" ||
              linkedLead.leadStatus === "CONTACTED" ||
              linkedLead.leadStatus === "REPLIED" ||
              linkedLead.leadStatus === "INTERESTED" ||
              linkedLead.leadStatus === "FOLLOW_UP" ||
              linkedLead.leadStatus === "MEETING" ||
              linkedLead.leadStatus === "PROPOSAL" ||
              linkedLead.leadStatus === "WON";

            if (isConnected) {
              return NextResponse.json(
                {
                  error:
                    "Cannot remove a Connected Lead. Once outreach has started or a lead is connected, its relationship with Leads is protected.",
                },
                { status: 400 }
              );
            }

            // Unprotected lead (status is NEW and no outreach): safe to remove from /leads
            await Lead.deleteOne({ _id: linkedLead._id, userId });
          }

          finderDoc.leadId = null;
        }

        finderDoc.isConfirmed = false;
        await finderDoc.save();

        return NextResponse.json({
          success: true,
          message: "Lead removed from Leads route.",
          business: transformLeadFinderBusiness(finderDoc, null),
        });
      }
    }

    // 2. Handle Business Information Updates
    const updateFields: any = {};
    if (body.businessName !== undefined) updateFields.businessName = body.businessName.trim();
    if (body.phone !== undefined) updateFields.phone = body.phone?.trim() || null;
    if (body.email !== undefined) updateFields.email = body.email?.trim() || null;
    if (body.whatsapp !== undefined) updateFields.whatsapp = body.whatsapp?.trim() || null;
    if (body.facebook !== undefined) updateFields.facebook = body.facebook?.trim() || null;
    if (body.instagram !== undefined) updateFields.instagram = body.instagram?.trim() || null;
    if (body.linkedin !== undefined) updateFields.linkedin = body.linkedin?.trim() || null;
    if (body.twitter !== undefined) updateFields.twitter = body.twitter?.trim() || null;
    if (body.website !== undefined) updateFields.website = body.website?.trim() || null;
    if (body.fullAddress !== undefined) updateFields.fullAddress = body.fullAddress?.trim() || null;
    if (body.businessCategory !== undefined) updateFields.businessCategory = body.businessCategory?.trim() || null;
    if (body.rating !== undefined) updateFields.rating = body.rating;
    if (body.totalReviews !== undefined) updateFields.totalReviews = body.totalReviews;
    if (body.openClosed !== undefined) updateFields.openClosed = body.openClosed;
    if (body.openingHours !== undefined) updateFields.openingHours = body.openingHours;

    // Check duplicate if core identifying fields are changed
    if (
      updateFields.businessName ||
      updateFields.phone ||
      updateFields.website ||
      updateFields.fullAddress
    ) {
      const candidate = {
        name: updateFields.businessName || finderDoc.businessName,
        phone: updateFields.phone !== undefined ? updateFields.phone : finderDoc.phone,
        website: updateFields.website !== undefined ? updateFields.website : finderDoc.website,
        fullAddress:
          updateFields.fullAddress !== undefined ? updateFields.fullAddress : finderDoc.fullAddress,
      };

      const otherBusinesses = await LeadFinderBusiness.find({
        userId,
        _id: { $ne: finderDoc._id },
      })
        .select("businessName phone website fullAddress")
        .lean();

      const isDupe = otherBusinesses.some((existing) =>
        isDuplicateBusiness(candidate, existing)
      );

      if (isDupe) {
        return NextResponse.json(
          {
            error:
              "Update would create a duplicate with another business already in your Lead Finder.",
          },
          { status: 400 }
        );
      }
    }

    // If there is a linked lead, synchronize the updated business fields
    const linkedLead = await Lead.findOne({
      $or: [
        ...(finderDoc.leadId ? [{ _id: finderDoc.leadId }] : []),
        { finderBusinessId: finderDoc._id },
      ],
      userId,
    });

    if (linkedLead) {
      const leadUpdates: any = {};
      if (updateFields.businessName) leadUpdates.businessName = updateFields.businessName;
      if (updateFields.businessCategory) leadUpdates.industry = updateFields.businessCategory;
      if (updateFields.fullAddress) leadUpdates.location = updateFields.fullAddress;
      if (updateFields.phone !== undefined) leadUpdates.phone = updateFields.phone || undefined;
      if (updateFields.email !== undefined) leadUpdates.email = updateFields.email || undefined;
      if (updateFields.whatsapp !== undefined) leadUpdates.whatsapp = updateFields.whatsapp || undefined;
      if (updateFields.facebook !== undefined) leadUpdates.facebook = updateFields.facebook || undefined;
      if (updateFields.instagram !== undefined) leadUpdates.instagram = updateFields.instagram || undefined;
      if (updateFields.linkedin !== undefined) leadUpdates.linkedin = updateFields.linkedin || undefined;
      if (updateFields.twitter !== undefined) leadUpdates.twitter = updateFields.twitter || undefined;
      if (updateFields.website !== undefined) {
        leadUpdates.website = updateFields.website || undefined;
        leadUpdates.websiteStatus = updateFields.website ? "OTHER" : "NO_WEBSITE";
      }

      if (Object.keys(leadUpdates).length > 0) {
        await Lead.updateOne(
          { _id: linkedLead._id, userId },
          { $set: leadUpdates }
        );
      }

      if (!finderDoc.leadId) {
        updateFields.leadId = linkedLead._id;
      }
    }

    const updated = await LeadFinderBusiness.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateFields },
      { new: true }
    ).populate({
      path: "leadId",
      select: "leadStatus email whatsapp facebook instagram linkedin twitter",
    });

    const connectedStatus = (updated?.leadId as any)?.leadStatus || null;

    return NextResponse.json({
      success: true,
      message: "Lead Finder business updated.",
      business: transformLeadFinderBusiness(updated, connectedStatus),
    });
  } catch (err: any) {
    console.error("PATCH /api/lead-finder/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update Lead Finder business", details: err.message },
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

    const userId = authUser.userId;
    const { id } = await context.params;

    // Requirement 10 & 26: Deleting a Finder record only deletes the Finder business.
    // Connected or confirmed Leads in /leads remain safe and are NOT deleted.
    const deleted = await LeadFinderBusiness.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Lead Finder business not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead Finder business removed. Any connected Lead remains safe in your Leads data.",
    });
  } catch (err: any) {
    console.error("DELETE /api/lead-finder/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete Lead Finder business", details: err.message },
      { status: 500 }
    );
  }
}
