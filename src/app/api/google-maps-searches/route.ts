import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { GoogleMapsSearch, LeadFinderBusiness, Lead } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.userId;

    const searches = await GoogleMapsSearch.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const [finderDocs, leadDocs] = await Promise.all([
      LeadFinderBusiness.find({ userId }).select("location fullAddress leadId").lean(),
      Lead.find({ userId }).select("location finderBusinessId").lean(),
    ]);

    const existingFinderIds = new Set(finderDocs.map((f) => f._id.toString()));

    const formatted = searches.map((s) => {
      const normQuery = s.query.trim().toLowerCase();
      const altQuery = `${s.category.trim()}, ${s.city.trim()}, ${s.country.trim()}`.toLowerCase();

      let count = 0;

      // Count matching LeadFinderBusiness records
      for (const f of finderDocs) {
        const loc = (f.location || "").trim().toLowerCase();
        const addr = (f.fullAddress || "").trim().toLowerCase();
        if (
          loc === normQuery ||
          loc === altQuery ||
          (!loc && addr && addr.includes(s.city.toLowerCase()) && addr.includes(s.country.toLowerCase()))
        ) {
          count++;
        }
      }

      // Count any Lead that was preserved when finder business was deleted
      for (const l of leadDocs) {
        const isOrphanedLead =
          !l.finderBusinessId || !existingFinderIds.has(l.finderBusinessId.toString());
        if (isOrphanedLead) {
          const loc = (l.location || "").trim().toLowerCase();
          if (loc === normQuery || loc === altQuery) {
            count++;
          }
        }
      }

      return {
        id: s._id.toString(),
        category: s.category,
        country: s.country,
        city: s.city,
        query: s.query,
        businessCount: count,
        timestamp: new Date(s.createdAt).toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      searches: formatted,
    });
  } catch (err: any) {
    console.error("GET /api/google-maps-searches error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Google Maps searches", details: err.message },
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

    const userId = authUser.userId;
    const body = await req.json();

    const category = (body.category || "").trim();
    const country = (body.country || "").trim();
    const city = (body.city || "").trim();

    if (!category || !country || !city) {
      return NextResponse.json(
        { error: "Category, country, and city are required." },
        { status: 400 }
      );
    }

    const query = `${category}, ${city}, ${country}`;

    // Remove existing identical query for this user so it can be refreshed at the top
    await GoogleMapsSearch.deleteMany({
      userId,
      category: { $regex: new RegExp(`^${category}$`, "i") },
      country: { $regex: new RegExp(`^${country}$`, "i") },
      city: { $regex: new RegExp(`^${city}$`, "i") },
    });

    const newSearch = await GoogleMapsSearch.create({
      userId,
      category,
      country,
      city,
      query,
      createdAt: new Date(),
    });



    return NextResponse.json(
      {
        success: true,
        search: {
          id: newSearch._id.toString(),
          category: newSearch.category,
          country: newSearch.country,
          city: newSearch.city,
          query: newSearch.query,
          timestamp: new Date(newSearch.createdAt).toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/google-maps-searches error:", err);
    return NextResponse.json(
      { error: "Failed to save Google Maps search", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.userId;
    await GoogleMapsSearch.deleteMany({ userId });

    return NextResponse.json({
      success: true,
      message: "Recent search history cleared.",
    });
  } catch (err: any) {
    console.error("DELETE /api/google-maps-searches error:", err);
    return NextResponse.json(
      { error: "Failed to clear search history", details: err.message },
      { status: 500 }
    );
  }
}
