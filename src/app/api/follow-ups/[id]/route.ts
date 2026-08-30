import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { FollowUp, OutreachActivity } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { followUpUpdateSchema } from "@/lib/validations/schemas";
import { transformFollowUp } from "@/lib/transformers";

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

    const parseResult = followUpUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const updateFields: any = {};

    if (data.channel !== undefined) updateFields.channel = data.channel;
    if (data.message !== undefined) updateFields.message = data.message.trim();
    if (data.notes !== undefined) updateFields.notes = data.notes.trim();
    if (data.dueTime !== undefined) updateFields.dueTime = data.dueTime;
    if (data.priority !== undefined) updateFields.priority = data.priority.toUpperCase();

    if (data.scheduledAt) {
      updateFields.scheduledAt = new Date(data.scheduledAt);
      if (!data.status) {
        updateFields.status = "PENDING";
      }
    }

    if (data.status) {
      const st = data.status.toUpperCase();
      updateFields.status = st;
      if (st === "COMPLETED") {
        updateFields.completedAt = new Date();
      }
    }

    const updated = await FollowUp.findOneAndUpdate(
      { _id: id, userId: authUser.userId },
      { $set: updateFields },
      { new: true }
    )
      .populate("leadId")
      .lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Follow-up not found or unauthorized" },
        { status: 404 }
      );
    }

    // If completed, log activity to lead timeline
    if (data.status?.toUpperCase() === "COMPLETED" && updated.leadId) {
      await OutreachActivity.create({
        userId: authUser.userId,
        leadId: (updated.leadId as any)._id,
        channel: "SYSTEM",
        message: `Follow-up task '${updated.notes || "Follow-up"}' marked completed.`,
        status: "COMPLETED",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Follow-up updated successfully.",
      followUp: transformFollowUp(updated, updated.leadId),
    });
  } catch (err: any) {
    console.error("PATCH /api/follow-ups/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update follow-up", details: err.message },
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

    const deleted = await FollowUp.findOneAndDelete({
      _id: id,
      userId: authUser.userId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Follow-up not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Follow-up removed.",
    });
  } catch (err: any) {
    console.error("DELETE /api/follow-ups/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete follow-up", details: err.message },
      { status: 500 }
    );
  }
}
