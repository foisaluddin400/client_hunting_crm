import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Lead } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.userId;
    const userObjectId = new Types.ObjectId(userId);

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const currentYear = now.getFullYear();

    // Determine available years dynamically from DB records and current year
    const earliestLead = await Lead.findOne({ userId })
      .sort({ createdAt: 1 })
      .select("createdAt")
      .lean();

    let minYear = 2026;
    if (earliestLead && earliestLead.createdAt) {
      const earliestYear = new Date(earliestLead.createdAt).getFullYear();
      if (!isNaN(earliestYear)) {
        minYear = Math.min(earliestYear, 2026);
      }
    }

    const maxYear = Math.max(currentYear, 2026);
    const availableYears: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      availableYears.push(y);
    }
    // Guarantee 2026 is present
    if (!availableYears.includes(2026)) {
      availableYears.push(2026);
      availableYears.sort((a, b) => b - a);
    }

    const requestedYear = parseInt(searchParams.get("year") || "", 10);
    const selectedYear = !isNaN(requestedYear) && requestedYear >= 2000 ? requestedYear : availableYears[0];

    // Compute range for selected year in Asia/Dhaka (UTC+6)
    // 00:00:00.000 Jan 1 Asia/Dhaka is previous year Dec 31 18:00:00.000 UTC
    const startOfYear = new Date(Date.UTC(selectedYear - 1, 11, 31, 18, 0, 0, 0));
    // 23:59:59.999 Dec 31 Asia/Dhaka is current year Dec 31 17:59:59.999 UTC
    const endOfYear = new Date(Date.UTC(selectedYear, 11, 31, 17, 59, 59, 999));

    const monthlyAggregation = await Lead.aggregate([
      {
        $match: {
          userId: userObjectId,
          createdAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: {
            $month: {
              date: "$createdAt",
              timezone: "Asia/Dhaka",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const countsMap: Record<number, number> = {};
    let totalYearLeads = 0;

    for (const item of monthlyAggregation) {
      const monthNum = typeof item._id === "number" ? item._id : parseInt(item._id, 10);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        countsMap[monthNum] = item.count;
        totalYearLeads += item.count;
      }
    }

    // Format all 12 months with 0 as default
    const months = MONTH_NAMES.map((name, idx) => {
      const monthNum = idx + 1;
      const count = countsMap[monthNum] || 0;
      return {
        month: monthNum,
        name,
        shortName: MONTH_SHORT[idx],
        count,
      };
    });

    return NextResponse.json({
      success: true,
      year: selectedYear,
      availableYears,
      months,
      totalYearLeads,
    });
  } catch (err: any) {
    console.error("GET /api/dashboard/lead-overview error:", err);
    return NextResponse.json(
      { error: "Failed to fetch lead overview", details: err.message },
      { status: 500 }
    );
  }
}
