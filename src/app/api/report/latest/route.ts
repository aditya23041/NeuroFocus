import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import StudySession from "@/models/StudySession";
import BlockedApplication from "@/models/BlockedApplication";
import Violation from "@/models/Violation";
import { getAuthUser } from "@/lib/auth";
import { calculateGrade } from "@/lib/focusEngine";

export async function GET(request: Request) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get the most recent completed session
    const latestSession = await StudySession.findOne({
      userId,
      status: { $in: ["completed", "completed_early"] },
    }).sort({ startTime: -1 });

    if (!latestSession) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Count violations for this session
    const violationCount = await Violation.countDocuments({ sessionId: latestSession._id });

    // Count blocked apps
    const blockedAppsCount = await BlockedApplication.countDocuments({ userId, enabled: true });

    const grade = calculateGrade(latestSession.focusScore);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: latestSession._id,
        studyTime: latestSession.durationSeconds,
        focusScore: latestSession.focusScore,
        distractions: violationCount,
        blockedApps: blockedAppsCount,
        productivityGrade: grade,
        objective: latestSession.objective,
        mode: latestSession.mode,
        date: latestSession.startTime,
        distractionBreakdown: latestSession.distractions,
      },
    });
  } catch (err) {
    console.error("[API] Report latest error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
