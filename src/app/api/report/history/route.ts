import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import StudySession from "@/models/StudySession";
import { getAuthUser } from "@/lib/auth";
import { calculateGrade } from "@/lib/focusEngine";

export async function GET(request: Request) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get all completed sessions, newest first
    const sessions = await StudySession.find({
      userId,
      status: { $in: ["completed", "completed_early"] },
    })
      .sort({ startTime: -1 })
      .limit(20)
      .lean();

    const reports = sessions.map((s) => ({
      sessionId: s._id,
      objective: s.objective || s.name,
      mode: s.mode,
      studyTime: s.durationSeconds,
      focusScore: s.focusScore,
      grade: calculateGrade(s.focusScore),
      distractedSeconds: s.distractedSeconds,
      date: s.startTime,
      status: s.status,
      distractions: s.distractions,
    }));

    return NextResponse.json({ success: true, data: reports });
  } catch (err) {
    console.error("[API] Report history error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
