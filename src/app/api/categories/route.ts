import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { User, UserSettings } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { DEFAULT_BUSINESS_CATEGORIES } from "@/constants/categories";
import { DEFAULT_COUNTRIES } from "@/constants/countries";

// Helper to deduplicate array of strings while preserving case/trimming
function cleanArray(items?: any[]): string[] | undefined {
  if (!items || !Array.isArray(items)) return undefined;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        result.push(trimmed);
      }
    }
  }
  return result;
}

// Helper to resolve user ID from authenticated token
async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authUser = await getAuthUser(req);
  return authUser?.userId || null;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json({
        success: true,
        categories: DEFAULT_BUSINESS_CATEGORIES,
        countries: DEFAULT_COUNTRIES,
      });
    }

    const userObjectId = new Types.ObjectId(userId);
    const settings = await UserSettings.findOne({ userId: userObjectId }).lean();

    const categories =
      settings?.businessCategories && settings.businessCategories.length > 0
        ? settings.businessCategories
        : DEFAULT_BUSINESS_CATEGORIES;

    const countries =
      settings?.targetCountries && settings.targetCountries.length > 0
        ? settings.targetCountries
        : DEFAULT_COUNTRIES;

    return NextResponse.json({
      success: true,
      categories,
      countries,
    });
  } catch (err: any) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json(
      { error: "Failed to fetch categories", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();

    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userObjectId = new Types.ObjectId(userId);
    const body = await req.json();
    const cleanedCategories = cleanArray(body.categories);
    const cleanedCountries = cleanArray(body.countries);

    const updateFields: Record<string, any> = {};
    if (cleanedCategories !== undefined) {
      updateFields.businessCategories = cleanedCategories;
    }
    if (cleanedCountries !== undefined) {
      updateFields.targetCountries = cleanedCountries;
    }

    const updatedSettings = await UserSettings.findOneAndUpdate(
      { userId: userObjectId },
      { $set: updateFields },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Categories updated successfully",
      categories: updatedSettings?.businessCategories || cleanedCategories || DEFAULT_BUSINESS_CATEGORIES,
      countries: updatedSettings?.targetCountries || cleanedCountries || DEFAULT_COUNTRIES,
    });
  } catch (err: any) {
    console.error("PUT /api/categories error:", err);
    return NextResponse.json(
      { error: "Failed to update categories", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userObjectId = new Types.ObjectId(userId);
    const body = await req.json();
    const categoryToAdd = typeof body.category === "string" ? body.category.trim() : "";
    const countryToAdd = typeof body.country === "string" ? body.country.trim() : "";

    const currentSettings = await UserSettings.findOne({ userId: userObjectId });
    const currentCategories: string[] =
      currentSettings?.businessCategories && currentSettings.businessCategories.length > 0
        ? currentSettings.businessCategories
        : [...DEFAULT_BUSINESS_CATEGORIES];

    const currentCountries: string[] =
      currentSettings?.targetCountries && currentSettings.targetCountries.length > 0
        ? currentSettings.targetCountries
        : [...DEFAULT_COUNTRIES];

    let updatedCategories = currentCategories;
    let updatedCountries = currentCountries;

    if (categoryToAdd) {
      const exists = currentCategories.some(
        (c) => c.toLowerCase() === categoryToAdd.toLowerCase()
      );
      if (!exists) {
        updatedCategories = [categoryToAdd, ...currentCategories];
      }
    }

    if (countryToAdd) {
      const exists = currentCountries.some(
        (c) => c.toLowerCase() === countryToAdd.toLowerCase()
      );
      if (!exists) {
        updatedCountries = [countryToAdd, ...currentCountries];
      }
    }

    const updatedSettings = await UserSettings.findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: {
          businessCategories: updatedCategories,
          targetCountries: updatedCountries,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Category added successfully",
      categories: updatedSettings?.businessCategories || updatedCategories,
      countries: updatedSettings?.targetCountries || updatedCountries,
    });
  } catch (err: any) {
    console.error("POST /api/categories error:", err);
    return NextResponse.json(
      { error: "Failed to add category", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();

    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userObjectId = new Types.ObjectId(userId);
    const { searchParams } = new URL(req.url);
    const body = req.headers.get("content-type")?.includes("application/json")
      ? await req.json().catch(() => ({}))
      : {};

    const categoryToDelete = (searchParams.get("category") || body.category || "").trim();
    const countryToDelete = (searchParams.get("country") || body.country || "").trim();

    const currentSettings = await UserSettings.findOne({ userId: userObjectId });
    let currentCategories: string[] =
      currentSettings?.businessCategories && currentSettings.businessCategories.length > 0
        ? currentSettings.businessCategories
        : [...DEFAULT_BUSINESS_CATEGORIES];

    let currentCountries: string[] =
      currentSettings?.targetCountries && currentSettings.targetCountries.length > 0
        ? currentSettings.targetCountries
        : [...DEFAULT_COUNTRIES];

    if (categoryToDelete) {
      currentCategories = currentCategories.filter(
        (c) => c.toLowerCase() !== categoryToDelete.toLowerCase()
      );
    }

    if (countryToDelete) {
      currentCountries = currentCountries.filter(
        (c) => c.toLowerCase() !== countryToDelete.toLowerCase()
      );
    }

    const updatedSettings = await UserSettings.findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: {
          businessCategories: currentCategories,
          targetCountries: currentCountries,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Category removed successfully",
      categories: updatedSettings?.businessCategories || currentCategories,
      countries: updatedSettings?.targetCountries || currentCountries,
    });
  } catch (err: any) {
    console.error("DELETE /api/categories error:", err);
    return NextResponse.json(
      { error: "Failed to delete category", details: err.message },
      { status: 500 }
    );
  }
}
