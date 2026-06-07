import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BlockedApplication from "@/models/BlockedApplication";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const apps = await BlockedApplication.find({ userId });

    return NextResponse.json({ success: true, data: apps });
  } catch (err) {
    console.error("[API] Apps GET error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { appName, executableName, enabled } = await request.json();

    if (!appName || !executableName) {
      return NextResponse.json(
        { success: false, error: "appName and executableName are required" },
        { status: 400 }
      );
    }

    const app = await BlockedApplication.create({
      userId,
      appName,
      executableName,
      enabled: enabled !== false,
    });

    return NextResponse.json({ success: true, data: app });
  } catch (err) {
    console.error("[API] Apps POST error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
