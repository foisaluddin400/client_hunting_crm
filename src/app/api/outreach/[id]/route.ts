import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { OutreachActivity } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { transformActivity } from "@/lib/transformers";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const updateFields: any = {};
    if (body.message !== undefined) updateFields.message = body.message.trim();
    if (body.subject !== undefined) updateFields.subject = body.subject.trim();
    if (body.notes !== undefined) updateFields.notes = body.notes.trim();
    if (body.status !== undefined) updateFields.status = body.status.toUpperCase();

    const updated = await OutreachActivity.findOneAndUpdate(
      { _id: id, userId: authUser.userId },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Outreach activity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Outreach activity updated.",
      activity: transformActivity(updated),
    });
  } catch (err: any) {
    console.error("PATCH /api/outreach/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update outreach activity", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const deleted = await OutreachActivity.findOneAndDelete({
      _id: id,
      userId: authUser.userId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Outreach activity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Outreach activity deleted.",
    });
  } catch (err: any) {
    console.error("DELETE /api/outreach/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete outreach activity", details: err.message },
      { status: 500 }
    );
  }
}
