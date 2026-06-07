import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import StudySession from "@/models/StudySession";
import FocusMetrics from "@/models/FocusMetrics";
import { getAuthUser } from "@/lib/auth";
import { broadcastToSession } from "@/lib/socket";

export async function POST(request: Request) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { mode, objective, duration } = await request.json();

    // Cancel any existing active session for this user
    await StudySession.updateMany(
      { userId, status: "active" },
      { status: "cancelled", endTime: new Date() }
    );

    // Create new active session
    const session = await StudySession.create({
      userId,
      name: objective || "Focus Session",
      mode: mode || "deep_work",
      startTime: new Date(),
      status: "active",
      focusScore: 100,
      distractions: { phone: 0, tab: 0, face: 0, people: 0, posture: 0, gaze: 0 },
      durationSeconds: 0,
      distractedSeconds: 0,
      objective: objective || "",
    });

    // Create initial focus metrics
    await FocusMetrics.create({
      sessionId: session._id,
      focusScore: 100,
      studyTime: 0,
      distractedTime: 0,
      distractionFreePercentage: 100,
      productivityStatus: "High",
      goalProgress: 0,
    });

    // Broadcast session started event
    broadcastToSession(session._id.toString(), "session_started", {
      sessionId: session._id,
      mode,
      objective,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session._id,
        startTime: session.startTime,
        status: session.status,
        focusScore: session.focusScore,
      },
    });
  } catch (err) {
    console.error("[API] Session start error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
