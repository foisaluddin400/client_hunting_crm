import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { GoogleMapsSearch } from "@/lib/models";
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
      .limit(10)
      .lean();

    const formatted = searches.map((s) => ({
      id: s._id.toString(),
      category: s.category,
      country: s.country,
      city: s.city,
      query: s.query,
      timestamp: new Date(s.createdAt).toISOString(),
    }));

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

    // Keep only the latest 10 searches for this user
    const totalSearches = await GoogleMapsSearch.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (totalSearches.length > 10) {
      const idsToRemove = totalSearches.slice(10).map((s) => s._id);
      await GoogleMapsSearch.deleteMany({ _id: { $in: idsToRemove } });
    }

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
