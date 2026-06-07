import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SessionConfig from "@/models/SessionConfig";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { mode, sessionDuration, objective } = await request.json();

    // Upsert: replace existing config for this user
    const config = await SessionConfig.findOneAndUpdate(
      { userId },
      {
        userId,
        mode: mode || "deep_work",
        sessionDuration: sessionDuration || 60,
        objective: objective || "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: config });
  } catch (err) {
    console.error("[API] Session config POST error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const config = await SessionConfig.findOne({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: config || { mode: "deep_work", sessionDuration: 60, objective: "" },
    });
  } catch (err) {
    console.error("[API] Session config GET error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
