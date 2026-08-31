import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Note } from "@/lib/models/Note";
import { getAuthUser } from "@/lib/auth";

/**
 * Lightweight and safe serverless HTML sanitizer for rich text notes.
 * Strips executable scripts, event handlers, and dangerous iframe/object tags
 * without heavy DOM/JSDOM dependencies that break on Vercel serverless functions.
 */
function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/\s+on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, "")
    .replace(/href\s*=\s*(["'])\s*javascript:[^"']*\1/gi, 'href="#"')
    .replace(/src\s*=\s*(["'])\s*javascript:[^"']*\1/gi, 'src=""');
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = mongoose.Types.ObjectId.isValid(authUser.userId)
      ? new mongoose.Types.ObjectId(authUser.userId)
      : authUser.userId;

    const note = await Note.findOne({ userId }).lean();

    return NextResponse.json({
      success: true,
      content: note?.content || "",
      updatedAt: note?.updatedAt,
    });
  } catch (err: any) {
    console.error("GET /api/notes error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notes", details: err?.message || "Internal server error" },
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

    const body = await req.json().catch(() => ({}));
    const rawContent = typeof body.content === "string" ? body.content : "";

    // Sanitize rich text content safely without crash-prone jsdom bindings
    const sanitizedContent = sanitizeHtmlContent(rawContent);

    const userId = mongoose.Types.ObjectId.isValid(authUser.userId)
      ? new mongoose.Types.ObjectId(authUser.userId)
      : authUser.userId;

    // Single document update / upsert per user
    const updatedNote = await Note.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          content: sanitizedContent,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Notes updated successfully.",
      content: updatedNote?.content ?? sanitizedContent,
      updatedAt: updatedNote?.updatedAt ?? new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("PUT /api/notes error:", err);
    return NextResponse.json(
      { error: "Failed to save notes", details: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

