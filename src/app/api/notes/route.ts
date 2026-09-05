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

/**
 * Helper to ensure the old unique index on userId is dropped if it exists.
 */
let indexChecked = false;
async function ensureMultiNoteIndex() {
  if (indexChecked) return;
  try {
    const indexes = await Note.collection.indexes();
    const uniqueUserIdIndex = indexes.find(
      (idx) => idx.name === "userId_1" && idx.unique
    );
    if (uniqueUserIdIndex) {
      await Note.collection.dropIndex("userId_1");
    }
  } catch {
    // Ignore error if index doesn't exist or already dropped
  } finally {
    indexChecked = true;
  }
}

// GET all notes for user
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureMultiNoteIndex();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = mongoose.Types.ObjectId.isValid(authUser.userId)
      ? new mongoose.Types.ObjectId(authUser.userId)
      : authUser.userId;

    const notes = await Note.find({ userId }).sort({ order: 1, createdAt: 1 }).lean();

    // If user has no notes, initialize a default first note
    if (notes.length === 0) {
      const defaultNote = await Note.create({
        userId,
        title: "Client Hunting",
        content: "",
        order: 0,
      });
      return NextResponse.json({
        success: true,
        notes: [
          {
            id: defaultNote._id.toString(),
            title: defaultNote.title,
            content: defaultNote.content,
            order: defaultNote.order,
            createdAt: defaultNote.createdAt.toISOString(),
            updatedAt: defaultNote.updatedAt.toISOString(),
          },
        ],
        content: "",
        updatedAt: defaultNote.updatedAt.toISOString(),
      });
    }

    const formattedNotes = notes.map((n) => ({
      id: n._id.toString(),
      title: n.title || "Untitled Note",
      content: n.content || "",
      order: n.order ?? 0,
      createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: n.updatedAt ? new Date(n.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      notes: formattedNotes,
      content: formattedNotes[0]?.content || "",
      updatedAt: formattedNotes[0]?.updatedAt,
    });
  } catch (err: any) {
    console.error("GET /api/notes error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notes", details: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create a new note tab
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureMultiNoteIndex();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = mongoose.Types.ObjectId.isValid(authUser.userId)
      ? new mongoose.Types.ObjectId(authUser.userId)
      : authUser.userId;

    const body = await req.json().catch(() => ({}));
    const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
    const title = rawTitle || "New Note";
    const rawContent = typeof body.content === "string" ? body.content : "";
    const sanitizedContent = sanitizeHtmlContent(rawContent);

    const count = await Note.countDocuments({ userId });

    const newNote = await Note.create({
      userId,
      title,
      content: sanitizedContent,
      order: count,
    });

    return NextResponse.json({
      success: true,
      message: "Note created successfully.",
      note: {
        id: newNote._id.toString(),
        title: newNote.title,
        content: newNote.content,
        order: newNote.order,
        createdAt: newNote.createdAt.toISOString(),
        updatedAt: newNote.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("POST /api/notes error:", err);
    return NextResponse.json(
      { error: "Failed to create note", details: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update a note by ID (or active note)
export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureMultiNoteIndex();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = mongoose.Types.ObjectId.isValid(authUser.userId)
      ? new mongoose.Types.ObjectId(authUser.userId)
      : authUser.userId;

    const body = await req.json().catch(() => ({}));
    const noteId = body.id || body.noteId;
    const rawTitle = typeof body.title === "string" ? body.title.trim() : undefined;
    const rawContent = typeof body.content === "string" ? body.content : undefined;

    const updateData: any = {};
    if (rawTitle !== undefined) {
      updateData.title = rawTitle || "Untitled Note";
    }
    if (rawContent !== undefined) {
      updateData.content = sanitizeHtmlContent(rawContent);
    }
    if (body.order !== undefined && typeof body.order === "number") {
      updateData.order = body.order;
    }

    let updatedNote = null;
    if (noteId && mongoose.Types.ObjectId.isValid(noteId)) {
      updatedNote = await Note.findOneAndUpdate(
        { _id: noteId, userId },
        { $set: updateData },
        { new: true }
      ).lean();
    } else {
      updatedNote = await Note.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, sort: { updatedAt: -1 } }
      ).lean();
    }

    if (!updatedNote) {
      // If note doesn't exist, create it
      const count = await Note.countDocuments({ userId });
      const created = await Note.create({
        userId,
        title: rawTitle || "Client Hunting",
        content: rawContent ? sanitizeHtmlContent(rawContent) : "",
        order: count,
      });
      return NextResponse.json({
        success: true,
        message: "Note saved.",
        note: {
          id: created._id.toString(),
          title: created.title,
          content: created.content,
          order: created.order,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
        content: created.content,
        updatedAt: created.updatedAt.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Note updated successfully.",
      note: {
        id: updatedNote._id.toString(),
        title: updatedNote.title || "Untitled Note",
        content: updatedNote.content || "",
        order: updatedNote.order ?? 0,
        createdAt: updatedNote.createdAt
          ? new Date(updatedNote.createdAt).toISOString()
          : new Date().toISOString(),
        updatedAt: updatedNote.updatedAt
          ? new Date(updatedNote.updatedAt).toISOString()
          : new Date().toISOString(),
      },
      content: updatedNote.content,
      updatedAt: updatedNote.updatedAt,
    });
  } catch (err: any) {
    console.error("PUT /api/notes error:", err);
    return NextResponse.json(
      { error: "Failed to save notes", details: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE a note by ID
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = mongoose.Types.ObjectId.isValid(authUser.userId)
      ? new mongoose.Types.ObjectId(authUser.userId)
      : authUser.userId;

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("id");

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    await Note.deleteOne({ _id: noteId, userId });

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully.",
    });
  } catch (err: any) {
    console.error("DELETE /api/notes error:", err);
    return NextResponse.json(
      { error: "Failed to delete note", details: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
