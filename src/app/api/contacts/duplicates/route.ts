import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead, LeadFinderBusiness } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { computeContactDuplicateCounts } from "@/lib/duplicate-detector";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.userId;

    // Fetch all user's Lead records and LeadFinderBusiness records
    const [leadDocs, finderDocs] = await Promise.all([
      Lead.find({ userId })
        .select("email phone whatsapp linkedin instagram facebook twitter finderBusinessId")
        .lean(),
      LeadFinderBusiness.find({ userId })
        .select("email phone whatsapp linkedin instagram facebook twitter leadId")
        .lean(),
    ]);

    // Build distinct businesses set:
    // A connected lead (where lead.finderBusinessId === finder._id or finder.leadId === lead._id)
    // represents the same business entity. We take all finderDocs, plus only leads not linked to any finderDoc.
    const linkedLeadIds = new Set(
      finderDocs
        .filter((f) => f.leadId)
        .map((f) => f.leadId!.toString())
    );

    const distinctRecords: Array<{
      email?: string | null;
      phone?: string | null;
      whatsapp?: string | null;
      linkedin?: string | null;
      instagram?: string | null;
      facebook?: string | null;
      twitter?: string | null;
    }> = [];

    // Add all finder businesses
    for (const f of finderDocs) {
      distinctRecords.push({
        email: f.email,
        phone: f.phone,
        whatsapp: f.whatsapp,
        linkedin: f.linkedin,
        instagram: f.instagram,
        facebook: f.facebook,
        twitter: f.twitter,
      });
    }

    // Add leads that are not already in finderDocs
    for (const l of leadDocs) {
      const isLinked =
        (l.finderBusinessId && finderDocs.some((f) => f._id.toString() === l.finderBusinessId!.toString())) ||
        linkedLeadIds.has(l._id.toString());

      if (!isLinked) {
        distinctRecords.push({
          email: l.email,
          phone: l.phone,
          whatsapp: l.whatsapp,
          linkedin: l.linkedin,
          instagram: l.instagram,
          facebook: l.facebook,
          twitter: l.twitter,
        });
      }
    }

    const counts = computeContactDuplicateCounts(distinctRecords);

    return NextResponse.json({
      success: true,
      counts,
    });
  } catch (err: any) {
    console.error("GET /api/contacts/duplicates error:", err);
    return NextResponse.json(
      { error: "Failed to detect duplicate contacts", details: err.message },
      { status: 500 }
    );
  }
}
