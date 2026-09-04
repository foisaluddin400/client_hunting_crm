import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { GoogleMapsSearch } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";

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

    const userId = authUser.userId;
    const { id } = await context.params;

    const deleted = await GoogleMapsSearch.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Search record not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Search record removed from history.",
    });
  } catch (err: any) {
    console.error("DELETE /api/google-maps-searches/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete search record", details: err.message },
      { status: 500 }
    );
  }
}
