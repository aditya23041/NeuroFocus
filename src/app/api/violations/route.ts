import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Violation from "@/models/Violation";
import StudySession from "@/models/StudySession";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get all sessions for this user
    const sessions = await StudySession.find({ userId }).select("_id");
    const sessionIds = sessions.map((s) => s._id);

    // Get violations for those sessions
    const violations = await Violation.find({ sessionId: { $in: sessionIds } })
      .sort({ timestamp: -1 })
      .limit(100);

    return NextResponse.json({ success: true, data: violations });
  } catch (err) {
    console.error("[API] Violations GET error:", err);
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
    const { sessionId, violationType, source } = await request.json();

    if (!sessionId || !violationType || !source) {
      return NextResponse.json(
        { success: false, error: "sessionId, violationType, and source are required" },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const session = await StudySession.findOne({ _id: sessionId, userId });
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const violation = await Violation.create({
      sessionId,
      violationType,
      source,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, data: violation });
  } catch (err) {
    console.error("[API] Violations POST error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
