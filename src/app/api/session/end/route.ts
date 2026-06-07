import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import StudySession from "@/models/StudySession";
import FocusMetrics from "@/models/FocusMetrics";
import { getAuthUser } from "@/lib/auth";
import { calculateGrade, removeEngine, getOrCreateEngine } from "@/lib/focusEngine";
import { broadcastToSession } from "@/lib/socket";

export async function POST(request: Request) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { sessionId, earlyEnd } = body;

    // Find the active session
    const query = sessionId
      ? { _id: sessionId, userId, status: "active" as const }
      : { userId, status: "active" as const };

    const session = await StudySession.findOne(query);
    if (!session) {
      return NextResponse.json({ success: false, error: "No active session found" }, { status: 404 });
    }

    // Calculate final duration
    const endTime = new Date();
    const durationMs = endTime.getTime() - new Date(session.startTime).getTime();
    const durationSeconds = Math.floor(durationMs / 1000);

    // Get engine data
    const engine = getOrCreateEngine(session._id.toString());
    const finalScore = engine.getScore();
    const grade = calculateGrade(finalScore);

    // Update session
    session.endTime = endTime;
    session.status = earlyEnd ? "completed_early" : "completed";
    session.durationSeconds = durationSeconds;
    session.distractedSeconds = engine.getDistratedSeconds();
    session.focusScore = finalScore;
    session.productivityGrade = grade;
    await session.save();

    // Update final metrics
    await FocusMetrics.findOneAndUpdate(
      { sessionId: session._id },
      {
        focusScore: finalScore,
        studyTime: durationSeconds,
        distractedTime: engine.getDistratedSeconds(),
        distractionFreePercentage: engine.getDistractionFreePercentage(),
        productivityStatus: engine.getProductivityStatus(),
        goalProgress: 100,
      }
    );

    // Broadcast session ended
    broadcastToSession(session._id.toString(), "session_ended", {
      sessionId: session._id,
      focusScore: finalScore,
      grade,
      durationSeconds,
    });

    // Cleanup engine
    removeEngine(session._id.toString());

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session._id,
        focusScore: finalScore,
        grade,
        durationSeconds,
        distractedSeconds: session.distractedSeconds,
        status: session.status,
        distractions: session.distractions,
      },
    });
  } catch (err) {
    console.error("[API] Session end error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
