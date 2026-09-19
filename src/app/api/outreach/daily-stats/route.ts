import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { OutreachActivity, FollowUp, UserSettings } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import {
  toDhakaDateString,
  getDhakaTodayDateString,
  getDhakaYesterdayDateString,
  formatDate,
  formatTime,
} from "@/lib/date-utils";

export interface ActivitySummaryItem {
  id: string;
  channel: string;
  senderEmail?: string;
  businessName: string;
  leadId?: string;
  time?: string;
  type?: string;
  isFollowUp?: boolean;
}

export interface ChannelBreakdown {
  newCount: number;
  followUpCount: number;
  total: number;
}

export interface SenderEmailBreakdown {
  newEmails: number;
  followUpEmails: number;
  total: number;
}

export interface DayStat {
  date: string; // "YYYY-MM-DD" in Asia/Dhaka
  displayDate: string; // "Sep 19, 2026" in Asia/Dhaka
  weekday: string; // "Saturday" in Asia/Dhaka
  isToday: boolean;
  isYesterday: boolean;

  // Detailed separation for Email by Sender Gmail
  emailsBySender: Record<string, SenderEmailBreakdown>;
  totalNewEmails: number;
  totalFollowUpEmails: number;
  totalEmails: number;

  // Detailed separation for platforms
  whatsapp: ChannelBreakdown;
  facebook: ChannelBreakdown;
  linkedin: ChannelBreakdown;
  instagram: ChannelBreakdown;
  twitter: ChannelBreakdown;

  // Overall totals
  totalNewOutreach: number;
  totalFollowUps: number;
  totalSent: number;

  // Backwards compatibility aliases
  whatsappCount: number;
  facebookCount: number;
  linkedinCount: number;
  instagramCount: number;
  twitterCount: number;
  followUpsCount: number;

  activities: ActivitySummaryItem[];
}

function formatDisplayDate(dateStr: string): { displayDate: string; weekday: string } {
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return {
      displayDate: formatDate(d),
      weekday: new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        weekday: "short",
      }).format(d),
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
        select: "businessName ceoName originalSenderEmail",
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
        select: "businessName ceoName originalSenderEmail",
      })
      .lean();

    // Map to group stats by Bangladesh date (YYYY-MM-DD)
    const dateMap = new Map<string, DayStat>();

    const getOrCreateDayStat = (dateStr: string): DayStat => {
      let existing = dateMap.get(dateStr);
      if (!existing) {
        const { displayDate, weekday } = formatDisplayDate(dateStr);
        const emailSenders: Record<string, SenderEmailBreakdown> = {};
        for (const gmail of configuredSenderGmails) {
          emailSenders[gmail] = { newEmails: 0, followUpEmails: 0, total: 0 };
        }

        existing = {
          date: dateStr,
          displayDate,
          weekday,
          isToday: false,
          isYesterday: false,
          emailsBySender: emailSenders,
          totalNewEmails: 0,
          totalFollowUpEmails: 0,
          totalEmails: 0,
          whatsapp: { newCount: 0, followUpCount: 0, total: 0 },
          facebook: { newCount: 0, followUpCount: 0, total: 0 },
          linkedin: { newCount: 0, followUpCount: 0, total: 0 },
          instagram: { newCount: 0, followUpCount: 0, total: 0 },
          twitter: { newCount: 0, followUpCount: 0, total: 0 },
          totalNewOutreach: 0,
          totalFollowUps: 0,
          totalSent: 0,
          whatsappCount: 0,
          facebookCount: 0,
          linkedinCount: 0,
          instagramCount: 0,
          twitterCount: 0,
          followUpsCount: 0,
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
      // Convert UTC createdAt to Bangladesh calendar date
      const dateStr = toDhakaDateString(act.createdAt);
      const stat = getOrCreateDayStat(dateStr);

      const ch = (act.channel || "").toUpperCase();
      const bName =
        (act.leadId as any)?.businessName ||
        (act.leadId as any)?.ceoName ||
        "Unknown Business";
      const leadIdStr = (act.leadId as any)?._id?.toString() || act.leadId?.toString() || "";
      // Formatted in Bangladesh Time (e.g. 5:24 PM)
      const timeStr = formatTime(act.createdAt);

      const isFollowUp =
        Boolean(act.followUpNumber) ||
        (ch === "SYSTEM" && act.status === "COMPLETED") ||
        act.notes?.toLowerCase().includes("follow-up") ||
        act.outreachType?.toLowerCase().includes("follow-up");

      if (isFollowUp) {
        const fuKey = `${dateStr}_${leadIdStr}_${act.followUpNumber || "act"}_${ch}`;
        if (!recordedFollowUpKeys.has(fuKey)) {
          recordedFollowUpKeys.add(fuKey);
          stat.totalFollowUps++;
          stat.followUpsCount++;
        }
      } else {
        stat.totalNewOutreach++;
      }

      if (ch === "EMAIL") {
        let sender = act.senderEmail ? act.senderEmail.toLowerCase().trim() : "";
        if (!sender && configuredSenderGmails.length === 1) {
          sender = configuredSenderGmails[0];
        }
        if (!sender) {
          sender = "Other / Default";
        }
        if (!stat.emailsBySender[sender]) {
          stat.emailsBySender[sender] = { newEmails: 0, followUpEmails: 0, total: 0 };
        }

        if (isFollowUp) {
          stat.emailsBySender[sender].followUpEmails++;
          stat.totalFollowUpEmails++;
        } else {
          stat.emailsBySender[sender].newEmails++;
          stat.totalNewEmails++;
        }
        stat.emailsBySender[sender].total++;
        stat.totalEmails++;
      } else if (ch === "WHATSAPP") {
        if (isFollowUp) {
          stat.whatsapp.followUpCount++;
        } else {
          stat.whatsapp.newCount++;
        }
        stat.whatsapp.total++;
        stat.whatsappCount = stat.whatsapp.total;
      } else if (ch === "FACEBOOK") {
        if (isFollowUp) {
          stat.facebook.followUpCount++;
        } else {
          stat.facebook.newCount++;
        }
        stat.facebook.total++;
        stat.facebookCount = stat.facebook.total;
      } else if (ch === "LINKEDIN") {
        if (isFollowUp) {
          stat.linkedin.followUpCount++;
        } else {
          stat.linkedin.newCount++;
        }
        stat.linkedin.total++;
        stat.linkedinCount = stat.linkedin.total;
      } else if (ch === "INSTAGRAM") {
        if (isFollowUp) {
          stat.instagram.followUpCount++;
        } else {
          stat.instagram.newCount++;
        }
        stat.instagram.total++;
        stat.instagramCount = stat.instagram.total;
      } else if (ch === "TWITTER") {
        if (isFollowUp) {
          stat.twitter.followUpCount++;
        } else {
          stat.twitter.newCount++;
        }
        stat.twitter.total++;
        stat.twitterCount = stat.twitter.total;
      }

      stat.totalSent = stat.totalNewOutreach + stat.totalFollowUps;

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
      const leadIdStr = (fu.leadId as any)?._id?.toString() || fu.leadId?.toString() || "";
      const bName =
        (fu.leadId as any)?.businessName ||
        (fu.leadId as any)?.ceoName ||
        "Client";
      const leadSenderEmail =
        (fu.leadId as any)?.originalSenderEmail?.toLowerCase().trim() ||
        configuredSenderGmails[0] ||
        "Other / Default";

      // 1. Check history entries
      if (Array.isArray(fu.history)) {
        for (const h of fu.history) {
          const sentDate = h.sentAt
            ? toDhakaDateString(h.sentAt)
            : h.sentDate;
          const ch = ((h.channel || fu.channel || "email").toUpperCase() as string);

          if (sentDate) {
            const fuKey = `${sentDate}_${leadIdStr}_${h.followUpNumber || 1}_${ch}`;
            if (!recordedFollowUpKeys.has(fuKey)) {
              recordedFollowUpKeys.add(fuKey);
              const stat = getOrCreateDayStat(sentDate);
              stat.totalFollowUps++;
              stat.followUpsCount++;

              if (ch === "EMAIL") {
                if (!stat.emailsBySender[leadSenderEmail]) {
                  stat.emailsBySender[leadSenderEmail] = { newEmails: 0, followUpEmails: 0, total: 0 };
                }
                stat.emailsBySender[leadSenderEmail].followUpEmails++;
                stat.emailsBySender[leadSenderEmail].total++;
                stat.totalFollowUpEmails++;
                stat.totalEmails++;
              } else if (ch === "WHATSAPP") {
                stat.whatsapp.followUpCount++;
                stat.whatsapp.total++;
                stat.whatsappCount = stat.whatsapp.total;
              } else if (ch === "FACEBOOK") {
                stat.facebook.followUpCount++;
                stat.facebook.total++;
                stat.facebookCount = stat.facebook.total;
              } else if (ch === "LINKEDIN") {
                stat.linkedin.followUpCount++;
                stat.linkedin.total++;
                stat.linkedinCount = stat.linkedin.total;
              } else if (ch === "INSTAGRAM") {
                stat.instagram.followUpCount++;
                stat.instagram.total++;
                stat.instagramCount = stat.instagram.total;
              } else if (ch === "TWITTER") {
                stat.twitter.followUpCount++;
                stat.twitter.total++;
                stat.twitterCount = stat.twitter.total;
              }

              stat.totalSent = stat.totalNewOutreach + stat.totalFollowUps;

              stat.activities.push({
                id: `fu-${fu._id}-${h.followUpNumber}`,
                channel: ch.toLowerCase(),
                businessName: bName,
                leadId: leadIdStr,
                time: h.sentAt ? formatTime(h.sentAt) : undefined,
                type: `${h.followUpNumber === 1 ? "1st" : "2nd"} Follow-up Sent`,
                isFollowUp: true,
              });
            }
          }
        }
      }

      // 2. Check firstFollowUpSentAt
      if (fu.firstFollowUpSentAt) {
        const sentDate = toDhakaDateString(fu.firstFollowUpSentAt);
        const ch = ((fu.channel || "email").toUpperCase() as string);
        const fuKey = `${sentDate}_${leadIdStr}_1_${ch}`;
        if (!recordedFollowUpKeys.has(fuKey)) {
          recordedFollowUpKeys.add(fuKey);
          const stat = getOrCreateDayStat(sentDate);
          stat.totalFollowUps++;
          stat.followUpsCount++;

          if (ch === "EMAIL") {
            if (!stat.emailsBySender[leadSenderEmail]) {
              stat.emailsBySender[leadSenderEmail] = { newEmails: 0, followUpEmails: 0, total: 0 };
            }
            stat.emailsBySender[leadSenderEmail].followUpEmails++;
            stat.emailsBySender[leadSenderEmail].total++;
            stat.totalFollowUpEmails++;
            stat.totalEmails++;
          } else if (ch === "WHATSAPP") {
            stat.whatsapp.followUpCount++;
            stat.whatsapp.total++;
            stat.whatsappCount = stat.whatsapp.total;
          } else if (ch === "FACEBOOK") {
            stat.facebook.followUpCount++;
            stat.facebook.total++;
            stat.facebookCount = stat.facebook.total;
          } else if (ch === "LINKEDIN") {
            stat.linkedin.followUpCount++;
            stat.linkedin.total++;
            stat.linkedinCount = stat.linkedin.total;
          } else if (ch === "INSTAGRAM") {
            stat.instagram.followUpCount++;
            stat.instagram.total++;
            stat.instagramCount = stat.instagram.total;
          } else if (ch === "TWITTER") {
            stat.twitter.followUpCount++;
            stat.twitter.total++;
            stat.twitterCount = stat.twitter.total;
          }

          stat.totalSent = stat.totalNewOutreach + stat.totalFollowUps;
        }
      }

      // 3. Check secondFollowUpSentAt
      if (fu.secondFollowUpSentAt) {
        const sentDate = toDhakaDateString(fu.secondFollowUpSentAt);
        const ch = ((fu.channel || "email").toUpperCase() as string);
        const fuKey = `${sentDate}_${leadIdStr}_2_${ch}`;
        if (!recordedFollowUpKeys.has(fuKey)) {
          recordedFollowUpKeys.add(fuKey);
          const stat = getOrCreateDayStat(sentDate);
          stat.totalFollowUps++;
          stat.followUpsCount++;

          if (ch === "EMAIL") {
            if (!stat.emailsBySender[leadSenderEmail]) {
              stat.emailsBySender[leadSenderEmail] = { newEmails: 0, followUpEmails: 0, total: 0 };
            }
            stat.emailsBySender[leadSenderEmail].followUpEmails++;
            stat.emailsBySender[leadSenderEmail].total++;
            stat.totalFollowUpEmails++;
            stat.totalEmails++;
          } else if (ch === "WHATSAPP") {
            stat.whatsapp.followUpCount++;
            stat.whatsapp.total++;
            stat.whatsappCount = stat.whatsapp.total;
          } else if (ch === "FACEBOOK") {
            stat.facebook.followUpCount++;
            stat.facebook.total++;
            stat.facebookCount = stat.facebook.total;
          } else if (ch === "LINKEDIN") {
            stat.linkedin.followUpCount++;
            stat.linkedin.total++;
            stat.linkedinCount = stat.linkedin.total;
          } else if (ch === "INSTAGRAM") {
            stat.instagram.followUpCount++;
            stat.instagram.total++;
            stat.instagramCount = stat.instagram.total;
          } else if (ch === "TWITTER") {
            stat.twitter.followUpCount++;
            stat.twitter.total++;
            stat.twitterCount = stat.twitter.total;
          }

          stat.totalSent = stat.totalNewOutreach + stat.totalFollowUps;
        }
      }

      // 4. Check completedAt
      if (fu.completedAt) {
        const compDate = toDhakaDateString(fu.completedAt);
        const ch = ((fu.channel || "email").toUpperCase() as string);
        const fuKey = `${compDate}_${leadIdStr}_comp_${ch}`;
        if (!recordedFollowUpKeys.has(fuKey)) {
          recordedFollowUpKeys.add(fuKey);
          const stat = getOrCreateDayStat(compDate);
          stat.totalFollowUps++;
          stat.followUpsCount++;
          stat.totalSent = stat.totalNewOutreach + stat.totalFollowUps;
        }
      }
    }

    // Determine Today, Yesterday, and Day Before Yesterday in Bangladesh Time
    const todayStr = getDhakaTodayDateString();
    const yesterdayStr = getDhakaYesterdayDateString();
    const now = new Date();
    const dayBeforeDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const dayBeforeStr = toDhakaDateString(dayBeforeDate);

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

    // Ensure today is always present in dictionary
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
