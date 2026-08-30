import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead, MessageTemplate } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { DEFAULT_TEMPLATES } from "@/lib/mock-data/templates";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.userId;

    // Check if user already has templates
    const existingTemplates = await MessageTemplate.countDocuments({ userId });
    if (existingTemplates === 0) {
      const templateDocs = DEFAULT_TEMPLATES.map((tpl) => ({
        userId,
        name: tpl.name,
        category: tpl.category.toUpperCase().replace(/\s+/g, "_"),
        subject: tpl.subject,
        message: tpl.body,
        channels: tpl.channels,
      }));
      await MessageTemplate.insertMany(templateDocs);
    }

    const leadCount = await Lead.countDocuments({ userId });

    return NextResponse.json({
      success: true,
      message: "Templates initialized.",
      leadsCount: leadCount,
    });
  } catch (err: any) {
    console.error("POST /api/seed error:", err);
    return NextResponse.json(
      { error: "Failed to initialize data", details: err.message },
      { status: 500 }
    );
  }
}
