import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { OutreachActivity, FollowUp, UserSettings } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";

interface ActivitySummaryItem {
  id: string;
  channel: string;
  senderEmail?: string;
  businessName: string;
  leadId?: string;
  time?: string;
  type?: string;
  isFollowUp?: boolean;
}

export interface DayStat {
  date: string; // "YYYY-MM-DD"
  displayDate: string; // "Sep 19, 2026"
  weekday: string; // "Saturday"
  isToday: boolean;
  isYesterday: boolean;
  emailsBySender: Record<string, number>;
  totalEmails: number;
  whatsappCount: number;
  facebookCount: number;
  linkedinCount: number;
  instagramCount: number;
  twitterCount: number;
  followUpsCount: number;
  totalSent: number;
  activities: ActivitySummaryItem[];
}

function getLocalDateString(d: Date, tzOffsetMinutes?: number): string {
  if (tzOffsetMinutes !== undefined && !isNaN(tzOffsetMinutes)) {
    const localTime = new Date(d.getTime() - tzOffsetMinutes * 60000);
    return localTime.toISOString().split("T")[0];
  }
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string): { displayDate: string; weekday: string } {
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const d = new Date(year, month - 1, day);
    return {
      displayDate: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    };
  }
  return { displayDate: dateStr, weekday: "" };
}

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

    const daysParam = searchParams.get("days");
    const isLast3Days = daysParam === "3";
    const tzOffsetParam = searchParams.get("tzOffset");
    const tzOffsetMinutes = tzOffsetParam !== null ? parseInt(tzOffsetParam, 10) : undefined;

    // Fetch user's configured Sender Gmails
    const userSettings = await UserSettings.findOne({ userId: userObjectId }).lean();
    const configuredSenderGmails: string[] = Array.isArray(userSettings?.senderGmails)
      ? userSettings.senderGmails.map((g: string) => g.toLowerCase().trim()).filter(Boolean)
      : [];

    // 1. Fetch all non-draft, non-failed outreach activities
    const activities = await OutreachActivity.find({
      userId: userObjectId,
      status: { $nin: ["DRAFT", "FAILED"] },
      channel: {
        $in: [
          "EMAIL",
          "WHATSAPP",
          "FACEBOOK",
          "LINKEDIN",
          "INSTAGRAM",
          "TWITTER",
          "SYSTEM",
        ],
      },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "leadId",
        select: "businessName ceoName",
      })
      .lean();

    // 2. Fetch all completed/sent follow-ups
    const followUps = await FollowUp.find({
      userId: userObjectId,
      $or: [
        { status: "COMPLETED" },
        { completedAt: { $exists: true, $ne: null } },
        { firstFollowUpSentAt: { $exists: true, $ne: null } },
        { secondFollowUpSentAt: { $exists: true, $ne: null } },
        { "history.sentAt": { $exists: true, $ne: null } },
      ],
    })
      .populate({
        path: "leadId",
        select: "businessName ceoName",
      })
      .lean();

    // Map to group stats by YYYY-MM-DD
    const dateMap = new Map<string, DayStat>();

    const getOrCreateDayStat = (dateStr: string): DayStat => {
      let existing = dateMap.get(dateStr);
      if (!existing) {
        const { displayDate, weekday } = formatDisplayDate(dateStr);
        const emailSenders: Record<string, number> = {};
        for (const gmail of configuredSenderGmails) {
          emailSenders[gmail] = 0;
        }

        existing = {
          date: dateStr,
          displayDate,
          weekday,
          isToday: false,
          isYesterday: false,
          emailsBySender: emailSenders,
          totalEmails: 0,
          whatsappCount: 0,
          facebookCount: 0,
          linkedinCount: 0,
          instagramCount: 0,
          twitterCount: 0,
          followUpsCount: 0,
          totalSent: 0,
          activities: [],
        };
        dateMap.set(dateStr, existing);
      }
      return existing;
    };

    // Process Outreach Activities
    const recordedFollowUpKeys = new Set<string>();

    for (const act of activities) {
      if (!act.createdAt) continue;
      const dateStr = getLocalDateString(new Date(act.createdAt), tzOffsetMinutes);
      const stat = getOrCreateDayStat(dateStr);

      const ch = (act.channel || "").toUpperCase();
      const bName =
        (act.leadId as any)?.businessName ||
        (act.leadId as any)?.ceoName ||
        "Unknown Business";
      const leadIdStr = (act.leadId as any)?._id?.toString() || act.leadId?.toString();
      const timeStr = new Date(act.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const isFollowUp =
        Boolean(act.followUpNumber) ||
        (ch === "SYSTEM" && act.status === "COMPLETED");

      if (isFollowUp) {
        const fuKey = `${dateStr}_${leadIdStr}_${act.followUpNumber || "comp"}`;
        if (!recordedFollowUpKeys.has(fuKey)) {
          recordedFollowUpKeys.add(fuKey);
          stat.followUpsCount++;
          stat.totalSent++;
        }
      }

      if (ch === "EMAIL") {
        let sender = act.senderEmail ? act.senderEmail.toLowerCase().trim() : "";
        if (!sender && configuredSenderGmails.length === 1) {
          sender = configuredSenderGmails[0];
        }
        if (!sender) {
          sender = "Other / Default";
        }
        stat.emailsBySender[sender] = (stat.emailsBySender[sender] || 0) + 1;
        stat.totalEmails++;
        if (!isFollowUp) stat.totalSent++;
      } else if (ch === "WHATSAPP") {
        stat.whatsappCount++;
        if (!isFollowUp) stat.totalSent++;
      } else if (ch === "FACEBOOK") {
        stat.facebookCount++;
        if (!isFollowUp) stat.totalSent++;
      } else if (ch === "LINKEDIN") {
        stat.linkedinCount++;
        if (!isFollowUp) stat.totalSent++;
      } else if (ch === "INSTAGRAM") {
        stat.instagramCount++;
        if (!isFollowUp) stat.totalSent++;
      } else if (ch === "TWITTER") {
        stat.twitterCount++;
        if (!isFollowUp) stat.totalSent++;
      }

      stat.activities.push({
        id: act._id.toString(),
        channel: ch.toLowerCase(),
        senderEmail: act.senderEmail,
        businessName: bName,
        leadId: leadIdStr,
        time: timeStr,
        type: act.outreachType || act.templateCategory || `${ch} message`,
        isFollowUp,
      });
    }

    // Process Follow-ups to capture any completed actions not already logged in OutreachActivity
    for (const fu of followUps) {
      const leadIdStr = (fu.leadId as any)?._id?.toString() || fu.leadId?.toString();
      const bName =
        (fu.leadId as any)?.businessName ||
        (fu.leadId as any)?.ceoName ||
        "Client";

      // 1. Check history entries
      if (Array.isArray(fu.history)) {
        for (const h of fu.history) {
          const sentDate = h.sentAt
            ? getLocalDateString(new Date(h.sentAt), tzOffsetMinutes)
            : h.sentDate;
          if (sentDate) {
            const fuKey = `${sentDate}_${leadIdStr}_${h.followUpNumber}`;
            if (!recordedFollowUpKeys.has(fuKey)) {
              recordedFollowUpKeys.add(fuKey);
              const stat = getOrCreateDayStat(sentDate);
              stat.followUpsCount++;
              stat.totalSent++;
              stat.activities.push({
                id: `fu-${fu._id}-${h.followUpNumber}`,
                channel: (h.channel || fu.channel || "follow-up").toLowerCase(),
                businessName: bName,
                leadId: leadIdStr,
                type: `${h.followUpNumber === 1 ? "1st" : "2nd"} Follow-up Sent`,
                isFollowUp: true,
              });
            }
          }
        }
      }

      // 2. Check firstFollowUpSentAt
      if (fu.firstFollowUpSentAt) {
        const sentDate = getLocalDateString(new Date(fu.firstFollowUpSentAt), tzOffsetMinutes);
        const fuKey = `${sentDate}_${leadIdStr}_1`;
        if (!recordedFollowUpKeys.has(fuKey)) {
          recordedFollowUpKeys.add(fuKey);
          const stat = getOrCreateDayStat(sentDate);
          stat.followUpsCount++;
          stat.totalSent++;
        }
      }

      // 3. Check secondFollowUpSentAt
      if (fu.secondFollowUpSentAt) {
        const sentDate = getLocalDateString(new Date(fu.secondFollowUpSentAt), tzOffsetMinutes);
        const fuKey = `${sentDate}_${leadIdStr}_2`;
        if (!recordedFollowUpKeys.has(fuKey)) {
          recordedFollowUpKeys.add(fuKey);
          const stat = getOrCreateDayStat(sentDate);
          stat.followUpsCount++;
          stat.totalSent++;
        }
      }

      // 4. Check completedAt
      if (fu.completedAt) {
        const compDate = getLocalDateString(new Date(fu.completedAt), tzOffsetMinutes);
        const fuKey = `${compDate}_${leadIdStr}_comp`;
        if (!recordedFollowUpKeys.has(fuKey)) {
          recordedFollowUpKeys.add(fuKey);
          const stat = getOrCreateDayStat(compDate);
          stat.followUpsCount++;
          stat.totalSent++;
        }
      }
    }

    // Determine Today and Yesterday in user's timezone
    const now = new Date();
    const todayStr = getLocalDateString(now, tzOffsetMinutes);
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getLocalDateString(yesterdayDate, tzOffsetMinutes);
    const dayBeforeDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const dayBeforeStr = getLocalDateString(dayBeforeDate, tzOffsetMinutes);

    // If Last 3 Days requested (Dashboard)
    if (isLast3Days) {
      const last3DateStrings = [todayStr, yesterdayStr, dayBeforeStr];
      const last3DaysStats: DayStat[] = last3DateStrings.map((dateStr) => {
        const stat = getOrCreateDayStat(dateStr);
        stat.isToday = dateStr === todayStr;
        stat.isYesterday = dateStr === yesterdayStr;
        return stat;
      });

      return NextResponse.json({
        success: true,
        days: last3DaysStats,
        configuredSenderGmails,
      });
    }

    // For Calendar: return all available dates sorted descending
    const allDays = Array.from(dateMap.values()).map((stat) => {
      stat.isToday = stat.date === todayStr;
      stat.isYesterday = stat.date === yesterdayStr;
      return stat;
    });

    allDays.sort((a, b) => b.date.localeCompare(a.date));

    // Also ensure today is always present in the dictionary
    const todayStat = getOrCreateDayStat(todayStr);
    todayStat.isToday = true;

    return NextResponse.json({
      success: true,
      todayDate: todayStr,
      days: allDays,
      dateMap: Object.fromEntries(dateMap.entries()),
      configuredSenderGmails,
    });
  } catch (err: any) {
    console.error("GET /api/outreach/daily-stats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch daily outreach stats", details: err.message },
      { status: 500 }
    );
  }
}
