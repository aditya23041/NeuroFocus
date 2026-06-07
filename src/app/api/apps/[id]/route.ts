import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BlockedApplication from "@/models/BlockedApplication";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const app = await BlockedApplication.findOneAndDelete({ _id: id, userId });
    if (!app) {
      return NextResponse.json({ success: false, error: "App not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error("[API] Apps DELETE error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
