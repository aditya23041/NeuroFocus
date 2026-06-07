import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import StudySession from "@/models/StudySession";
import FocusMetrics from "@/models/FocusMetrics";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find active session for this user
    const session = await StudySession.findOne({ userId, status: "active" });
    if (!session) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Get latest metrics
    const metrics = await FocusMetrics.findOne({ sessionId: session._id });

    // Calculate live study time
    const now = new Date();
    const studyTime = Math.floor((now.getTime() - new Date(session.startTime).getTime()) / 1000);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session._id,
        focusScore: metrics?.focusScore ?? session.focusScore,
        studyTime,
        distractedTime: metrics?.distractedTime ?? session.distractedSeconds,
        distractionFreePercentage: metrics?.distractionFreePercentage ?? 100,
        productivityStatus: metrics?.productivityStatus ?? "High",
        goalProgress: metrics?.goalProgress ?? 0,
        mode: session.mode,
        objective: session.objective,
        startTime: session.startTime,
        distractions: session.distractions,
      },
    });
  } catch (err) {
    console.error("[API] Session live error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
