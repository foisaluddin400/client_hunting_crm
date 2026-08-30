import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead } from "@/lib/models/Lead";
import { getAuthUser } from "@/lib/auth";
import { fromDbWebsiteStatus, fromDbLeadStatus } from "@/lib/transformers";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leadsDocs = await Lead.find({ userId: authUser.userId })
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Business Name",
      "CEO Name",
      "Industry",
      "Location",
      "Website",
      "Website Status",
      "Email",
      "WhatsApp",
      "Phone",
      "LinkedIn",
      "Instagram",
      "Facebook",
      "Twitter",
      "Lead Status",
      "Lead Score",
      "Created At",
      "Last Contact",
    ];

    const escapeCsv = (val?: any) => {
      if (val === undefined || val === null) return '""';
      const cleanStr = String(val).replace(/"/g, '""');
      return `"${cleanStr}"`;
    };

    const rows = leadsDocs.map((lead) => [
      escapeCsv(lead.businessName),
      escapeCsv(lead.ceoName),
      escapeCsv(lead.industry),
      escapeCsv(lead.location),
      escapeCsv(lead.website),
      escapeCsv(fromDbWebsiteStatus(lead.websiteStatus)),
      escapeCsv(lead.email),
      escapeCsv(lead.whatsapp),
      escapeCsv(lead.phone),
      escapeCsv(lead.linkedin),
      escapeCsv(lead.instagram),
      escapeCsv(lead.facebook),
      escapeCsv(lead.twitter),
      escapeCsv(fromDbLeadStatus(lead.leadStatus)),
      escapeCsv(lead.leadScore),
      escapeCsv(lead.createdAt ? new Date(lead.createdAt).toISOString().split("T")[0] : ""),
      escapeCsv(lead.lastContactAt ? new Date(lead.lastContactAt).toISOString().split("T")[0] : ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leadflow-leads.csv"',
      },
    });
  } catch (err: any) {
    console.error("GET /api/leads/export error:", err);
    return NextResponse.json(
      { error: "Failed to export leads", details: err.message },
      { status: 500 }
    );
  }
}
