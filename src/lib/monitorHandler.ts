import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import StudySession from "@/models/StudySession";
import FocusMetrics from "@/models/FocusMetrics";
import Violation from "@/models/Violation";
import { getAuthUser } from "@/lib/auth";
import { getOrCreateEngine } from "@/lib/focusEngine";
import { broadcastToSession } from "@/lib/socket";
import type { MonitorEventType } from "@/lib/focusEngine";

/**
 * Shared handler for all monitor event endpoints.
 * Processes a detection event, updates focus score, logs violation, broadcasts via socket.
 */
export async function handleMonitorEvent(
  request: Request,
  eventType: MonitorEventType,
  violationType: string,
  socketEvent: string
) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { sessionId } = body;

    // Find active session
    const query = sessionId
      ? { _id: sessionId, userId, status: "active" as const }
      : { userId, status: "active" as const };

    const session = await StudySession.findOne(query);
    if (!session) {
      return NextResponse.json({ success: false, error: "No active session found" }, { status: 404 });
    }

    const sid = session._id.toString();

    // Apply event to focus engine
    const engine = getOrCreateEngine(sid);
    const newScore = engine.applyEvent(eventType);

    // Update distraction breakdown on session
    const distractionKey = getDistractionKey(eventType);
    if (distractionKey) {
      await StudySession.updateOne(
        { _id: session._id },
        {
          $inc: { [`distractions.${distractionKey}`]: 1 },
          $set: {
            focusScore: newScore,
            distractedSeconds: engine.getDistratedSeconds(),
          },
        }
      );
    } else {
      await StudySession.updateOne(
        { _id: session._id },
        { $set: { focusScore: newScore } }
      );
    }

    // Update live metrics
    const studyTime = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
    await FocusMetrics.findOneAndUpdate(
      { sessionId: session._id },
      {
        focusScore: newScore,
        studyTime,
        distractedTime: engine.getDistratedSeconds(),
        distractionFreePercentage: engine.getDistractionFreePercentage(),
        productivityStatus: engine.getProductivityStatus(),
      }
    );

    // Log violation (only for negative events)
    if (eventType !== "face_present") {
      await Violation.create({
        sessionId: session._id,
        violationType,
        source: eventType,
        timestamp: new Date(),
      });
    }

    // Broadcast via Socket.io
    broadcastToSession(sid, socketEvent, {
      sessionId: sid,
      focusScore: newScore,
      eventType,
      productivityStatus: engine.getProductivityStatus(),
      distractionFreePercentage: engine.getDistractionFreePercentage(),
    });

    // Also broadcast the generic score update
    broadcastToSession(sid, "focus_score_updated", {
      sessionId: sid,
      focusScore: newScore,
      productivityStatus: engine.getProductivityStatus(),
    });

    return NextResponse.json({
      success: true,
      data: {
        focusScore: newScore,
        productivityStatus: engine.getProductivityStatus(),
        distractionFreePercentage: engine.getDistractionFreePercentage(),
      },
    });
  } catch (err) {
    console.error(`[API] Monitor ${eventType} error:`, err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

function getDistractionKey(eventType: MonitorEventType): string | null {
  switch (eventType) {
    case "phone_detected": return "phone";
    case "face_missing": return "face";
    case "multiple_people": return "people";
    case "poor_posture": return "posture";
    case "looking_away": return "gaze";
    default: return null;
  }
}
