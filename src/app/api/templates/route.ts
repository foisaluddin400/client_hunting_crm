import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { MessageTemplate } from "@/lib/models/MessageTemplate";
import { getAuthUser } from "@/lib/auth";
import { templateSchema } from "@/lib/validations/schemas";
import { transformTemplate } from "@/lib/transformers";
import { DEFAULT_TEMPLATES } from "@/lib/mock-data/templates";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let templatesDocs = await MessageTemplate.find({
      userId: authUser.userId,
    })
      .sort({ createdAt: 1 })
      .lean();

    // If user has no templates yet, seed default templates
    if (templatesDocs.length === 0) {
      const defaultDocs = DEFAULT_TEMPLATES.map((tpl) => ({
        userId: authUser.userId,
        name: tpl.name,
        category: tpl.category.toUpperCase().replace(/\s+/g, "_"),
        subject: tpl.subject,
        message: tpl.body,
        channels: tpl.channels,
      }));
      await MessageTemplate.insertMany(defaultDocs);
      templatesDocs = await MessageTemplate.find({
        userId: authUser.userId,
      })
        .sort({ createdAt: 1 })
        .lean();
    }

    return NextResponse.json({
      success: true,
      templates: templatesDocs.map(transformTemplate),
    });
  } catch (err: any) {
    console.error("GET /api/templates error:", err);
    return NextResponse.json(
      { error: "Failed to fetch templates", details: err.message },
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

    const body = await req.json();
    const parseResult = templateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, category, subject, message, channels } = parseResult.data;
    const catMapped = (category || "GENERAL").toUpperCase().replace(/\s+/g, "_") as any;

    const newTemplate: any = await MessageTemplate.create({
      userId: authUser.userId,
      name: name.trim(),
      category: catMapped,
      subject: subject?.trim() || undefined,
      message: message.trim(),
      channels: channels || ["email", "whatsapp", "linkedin"],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Template created successfully.",
        template: transformTemplate(
          newTemplate.toObject ? newTemplate.toObject() : newTemplate
        ),
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/templates error:", err);
    return NextResponse.json(
      { error: "Failed to create template", details: err.message },
      { status: 500 }
    );
  }
}
