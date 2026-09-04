import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { LeadFinderBusiness, Lead } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { isDuplicateBusiness } from "@/lib/duplicate-detector";

interface ScrapedBusinessInput {
  id?: string;
  name?: string | null;
  businessName?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  totalReviews?: number | null;
  openStatus?: string | null;
  openClosed?: string | null;
  openingHours?: string | null;
  category?: string | null;
  businessCategory?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  fullAddress?: string | null;
  mapsUrl?: string | null;
  googleMapsUrl?: string | null;
  scrapedAt?: number | string | null;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        {
          error: "CRM authentication required. Please log in with your Client Hunting CRM credentials.",
        },
        { status: 401 }
      );
    }

    const userId = authUser.userId;
    const body = await req.json();
    const businesses: ScrapedBusinessInput[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.businesses)
      ? body.businesses
      : Array.isArray(body?.items)
      ? body.items
      : Array.isArray(body?.leads)
      ? body.leads
      : [];

    if (businesses.length === 0) {
      return NextResponse.json(
        { error: "No businesses provided for import." },
        { status: 400 }
      );
    }

    // Load existing Finder businesses and Leads for this authenticated user to run duplicate checks
    const [existingFinderBusinesses, existingLeads] = await Promise.all([
      LeadFinderBusiness.find({ userId }).select("businessName phone website fullAddress").lean(),
      Lead.find({ userId }).select("businessName phone website location").lean(),
    ]);

    const results: Array<{
      id: string;
      name: string;
      status: "imported" | "duplicate" | "failed";
      existing?: boolean;
      message?: string;
    }> = [];

    let importedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    const toInsert: any[] = [];
    const activeCheckingPool = [
      ...existingFinderBusinesses.map((b) => ({
        businessName: b.businessName,
        phone: b.phone,
        website: b.website,
        fullAddress: b.fullAddress,
      })),
      ...existingLeads.map((l) => ({
        businessName: l.businessName,
        phone: l.phone,
        website: l.website,
        fullAddress: l.location,
      })),
    ];

    for (const item of businesses) {
      const bName = (item.name || item.businessName || "").trim();
      const rawId = item.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      if (!bName) {
        failedCount++;
        results.push({
          id: rawId,
          name: "Unknown Business",
          status: "failed",
          message: "Business name is required.",
        });
        continue;
      }

      const candidate = {
        name: bName,
        businessName: bName,
        phone: item.phone?.trim() || null,
        website: item.website?.trim() || null,
        address: (item.address || item.fullAddress || "").trim() || null,
        location: (item.address || item.fullAddress || "").trim() || null,
        fullAddress: (item.address || item.fullAddress || "").trim() || null,
      };

      // Check if candidate matches any existing business in the user's database or in the current batch
      const isDupe = activeCheckingPool.some((existing) =>
        isDuplicateBusiness(candidate, existing)
      );

      if (isDupe) {
        duplicateCount++;
        results.push({
          id: rawId,
          name: bName,
          status: "duplicate",
          existing: true,
          message: "Business already exists in your CRM database.",
        });
        continue;
      }

      // Add to checking pool to prevent duplicates within the same import batch
      activeCheckingPool.push({
        businessName: bName,
        phone: candidate.phone,
        website: candidate.website,
        fullAddress: candidate.fullAddress,
      });

      const foundTimestamp = item.scrapedAt
        ? new Date(typeof item.scrapedAt === "number" ? item.scrapedAt : item.scrapedAt)
        : new Date();

      toInsert.push({
        userId,
        businessName: bName,
        rating: typeof item.rating === "number" ? item.rating : null,
        totalReviews:
          typeof item.totalReviews === "number"
            ? item.totalReviews
            : typeof item.reviewCount === "number"
            ? item.reviewCount
            : null,
        openClosed: (item.openClosed || item.openStatus || "").trim() || null,
        openingHours: item.openingHours?.trim() || null,
        businessCategory: (item.businessCategory || item.category || "").trim() || null,
        phone: candidate.phone,
        email: item.email?.trim() || null,
        website: candidate.website,
        fullAddress: candidate.fullAddress,
        googleMapsUrl: (item.googleMapsUrl || item.mapsUrl || "").trim() || null,
        foundAt: isNaN(foundTimestamp.getTime()) ? new Date() : foundTimestamp,
        isConfirmed: false,
        leadId: null,
      });

      results.push({
        id: rawId,
        name: bName,
        status: "imported",
        message: "Saved to Lead Finder.",
      });
      importedCount++;
    }

    if (toInsert.length > 0) {
      await LeadFinderBusiness.insertMany(toInsert);
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
      duplicates: duplicateCount,
      failed: failedCount,
      totalProcessed: businesses.length,
      results,
    });
  } catch (err: any) {
    console.error("POST /api/lead-finder/import error:", err);
    return NextResponse.json(
      { error: "Failed to import businesses", details: err.message },
      { status: 500 }
    );
  }
}
