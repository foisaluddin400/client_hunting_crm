import { NextRequest, NextResponse } from "next/server";
import DOMPurify from "isomorphic-dompurify";
import connectToDatabase from "@/lib/mongodb";
import { Note } from "@/lib/models/Note";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await Note.findOne({ userId: authUser.userId }).lean();

    return NextResponse.json({
      success: true,
      content: note?.content || "",
      updatedAt: note?.updatedAt,
    });
  } catch (err: any) {
    console.error("GET /api/notes error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notes", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const rawContent = typeof body.content === "string" ? body.content : "";

    // Sanitize rich text content to prevent XSS vulnerabilities
    const sanitizedContent = DOMPurify.sanitize(rawContent, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["target", "rel"],
    });

    const updatedNote = await Note.findOneAndUpdate(
      { userId: authUser.userId },
      { $set: { content: sanitizedContent } },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Notes updated successfully.",
      content: updatedNote?.content || sanitizedContent,
      updatedAt: updatedNote?.updatedAt,
    });
  } catch (err: any) {
    console.error("PUT /api/notes error:", err);
    return NextResponse.json(
      { error: "Failed to save notes", details: err.message },
      { status: 500 }
    );
  }
}
