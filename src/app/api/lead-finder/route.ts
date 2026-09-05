import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { LeadFinderBusiness, Lead } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { transformLeadFinderBusiness } from "@/lib/transformers";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.userId;
    const { searchParams } = new URL(req.url);

    const search = (searchParams.get("search") || "").trim();
    const category = searchParams.get("category") || "all";
    const status = searchParams.get("status") || "all";
    const timeFilter = searchParams.get("timeFilter") || "all";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const query: any = { userId };

    // Search filter
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { businessName: regex },
        { phone: regex },
        { email: regex },
        { fullAddress: regex },
        { businessCategory: regex },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      query.businessCategory = category;
    }

    // Status filter
    if (status === "selected") {
      query.isConfirmed = true;
    } else if (status === "unselected") {
      query.isConfirmed = false;
    }

    // Date & Time filter
    if (timeFilter !== "all") {
      const now = new Date();
      if (timeFilter === "today") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.foundAt = { $gte: startOfToday };
      } else if (timeFilter === "yesterday") {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.foundAt = { $gte: startOfYesterday, $lt: endOfYesterday };
      } else if (timeFilter === "7days") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query.foundAt = { $gte: sevenDaysAgo };
      } else if (timeFilter === "30days") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query.foundAt = { $gte: thirtyDaysAgo };
      } else if (timeFilter === "custom" && startDateParam) {
        const start = new Date(startDateParam);
        const end = endDateParam ? new Date(endDateParam) : new Date();
        // End of the day for end date
        end.setHours(23, 59, 59, 999);
        query.foundAt = { $gte: start, $lte: end };
      }
    }

    const finderDocs = await LeadFinderBusiness.find(query)
      .populate({
        path: "leadId",
        select: "leadStatus email whatsapp facebook instagram linkedin twitter",
      })
      .sort({ foundAt: -1 })
      .lean();

    const transformed = finderDocs.map((doc) => {
      const connectedStatus = (doc.leadId as any)?.leadStatus || null;
      return transformLeadFinderBusiness(doc, connectedStatus);
    });

    // If status filter is "connected", filter by isConnected property
    const finalResults =
      status === "connected"
        ? transformed.filter((item) => item.isConnected)
        : transformed;

    return NextResponse.json({
      success: true,
      total: finalResults.length,
      businesses: finalResults,
    });
  } catch (err: any) {
    console.error("GET /api/lead-finder error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Lead Finder businesses", details: err.message },
      { status: 500 }
    );
  }
}

// Bulk action endpoint: All Leads confirmation
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.userId;
    const body = await req.json();

    if (body.action === "selectAll") {
      // Find all unselected businesses for this user
      const unselectedFinderList = await LeadFinderBusiness.find({
        userId,
        isConfirmed: false,
      });

      let addedCount = 0;

      for (const finder of unselectedFinderList) {
        const leadWhatsapp = finder.whatsapp || finder.phone || undefined;
        const leadPhone = finder.phone || finder.whatsapp || undefined;

        // Check if lead already exists for this finder business
        let targetLead = await Lead.findOne({
          $or: [{ finderBusinessId: finder._id }, ...(finder.leadId ? [{ _id: finder.leadId }] : [])],
          userId,
        });

        if (!targetLead) {
          targetLead = await Lead.create({
            userId,
            businessName: finder.businessName,
            industry: finder.businessCategory || "Other",
            location: finder.fullAddress || "Not specified",
            website: finder.website || undefined,
            websiteStatus: finder.website ? "OTHER" : "NO_WEBSITE",
            email: finder.email || undefined,
            phone: leadPhone,
            whatsapp: leadWhatsapp,
            facebook: finder.facebook || undefined,
            instagram: finder.instagram || undefined,
            linkedin: finder.linkedin || undefined,
            twitter: finder.twitter || undefined,
            leadStatus: "NEW",
            leadScore: 75,
            notes: `Imported via Google Maps Lead Scraper (${finder.googleMapsUrl || ""})`,
            finderBusinessId: finder._id,
            foundAt: finder.foundAt || new Date(),
          });
        } else {
          targetLead.businessName = finder.businessName;
          if (finder.businessCategory) targetLead.industry = finder.businessCategory;
          if (finder.fullAddress) targetLead.location = finder.fullAddress;
          if (finder.email) targetLead.email = finder.email;
          if (leadWhatsapp) targetLead.whatsapp = leadWhatsapp;
          if (leadPhone) targetLead.phone = leadPhone;
          if (finder.facebook) targetLead.facebook = finder.facebook;
          if (finder.instagram) targetLead.instagram = finder.instagram;
          if (finder.linkedin) targetLead.linkedin = finder.linkedin;
          if (finder.twitter) targetLead.twitter = finder.twitter;
          if (finder.website) {
            targetLead.website = finder.website;
            targetLead.websiteStatus = "OTHER";
          }
          await targetLead.save();
        }

        finder.isConfirmed = true;
        finder.leadId = targetLead._id as any;
        await finder.save();
        addedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Successfully confirmed ${addedCount} leads to the Leads route.`,
        selectedCount: addedCount,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/lead-finder error:", err);
    return NextResponse.json(
      { error: "Failed to perform bulk lead action", details: err.message },
      { status: 500 }
    );
  }
}
