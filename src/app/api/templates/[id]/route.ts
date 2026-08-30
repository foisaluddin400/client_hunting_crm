import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { MessageTemplate } from "@/lib/models/MessageTemplate";
import { getAuthUser } from "@/lib/auth";
import { templateSchema } from "@/lib/validations/schemas";
import { transformTemplate } from "@/lib/transformers";

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

    const parseResult = templateSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const updateFields: any = {};

    if (data.name !== undefined) updateFields.name = data.name.trim();
    if (data.category !== undefined)
      updateFields.category = data.category.toUpperCase().replace(/\s+/g, "_");
    if (data.subject !== undefined) updateFields.subject = data.subject.trim();
    if (data.message !== undefined) updateFields.message = data.message.trim();
    if (data.channels !== undefined) updateFields.channels = data.channels;

    const updated = await MessageTemplate.findOneAndUpdate(
      { _id: id, userId: authUser.userId },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Template not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Template updated successfully.",
      template: transformTemplate(updated),
    });
  } catch (err: any) {
    console.error("PATCH /api/templates/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update template", details: err.message },
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

    const deleted = await MessageTemplate.findOneAndDelete({
      _id: id,
      userId: authUser.userId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Template not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully.",
    });
  } catch (err: any) {
    console.error("DELETE /api/templates/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete template", details: err.message },
      { status: 500 }
    );
  }
}
