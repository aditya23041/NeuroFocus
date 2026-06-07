import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import StudySession from "@/models/StudySession";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const userId = getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get all completed sessions for this user, newest first
    const sessions = await StudySession.find({
      userId,
      status: { $in: ["completed", "completed_early"] },
    })
      .sort({ startTime: -1 })
      .limit(50)
      .lean();

    // Calculate aggregate stats
    const totalSessions = sessions.length;
    const avgFocusScore =
      totalSessions > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) / totalSessions)
        : 0;

    const totalStudySeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const totalDistractedSeconds = sessions.reduce((sum, s) => sum + (s.distractedSeconds || 0), 0);

    // Streak calculation
    const streakDays = calculateStreak(sessions);

    // Weekly trend (last 7 days)
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyTrend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayLabel = daysOfWeek[d.getDay()];
      const daySessions = sessions.filter((s) => {
        const sDate = new Date(s.startTime);
        return sDate.toDateString() === d.toDateString();
      });

      const focusValue =
        daySessions.length > 0
          ? Math.round(daySessions.reduce((acc, curr) => acc + (curr.focusScore || 0), 0) / daySessions.length)
          : 0;

      return { day: dayLabel, focus: focusValue };
    });

    // Distraction breakdown
    let phoneSum = 0, tabSum = 0, faceSum = 0, peopleSum = 0;
    sessions.forEach((s) => {
      if (s.distractions) {
        phoneSum += s.distractions.phone || 0;
        tabSum += s.distractions.tab || 0;
        faceSum += s.distractions.face || 0;
        peopleSum += s.distractions.people || 0;
      }
    });

    const totalDist = Math.max(1, phoneSum + tabSum + faceSum + peopleSum);
    const distractionBreakdown = [
      { name: "Phone Use", value: Math.round((phoneSum / totalDist) * 100), color: "#ffb4ab" },
      { name: "Tab Switching", value: Math.round((tabSum / totalDist) * 100), color: "#ffb95f" },
      { name: "Face Sensor Absence", value: Math.round((faceSum / totalDist) * 100), color: "#4edea3" },
      { name: "Multiple People Around", value: Math.round((peopleSum / totalDist) * 100), color: "#c3c0ff" },
    ];

    // Productivity insight
    let productivityInsight = "Keep up the great work!";
    if (avgFocusScore >= 85) productivityInsight = "Outstanding focus! You are in the top tier.";
    else if (avgFocusScore >= 70) productivityInsight = "Good focus levels. Try reducing phone usage for improvement.";
    else if (avgFocusScore >= 50) productivityInsight = "Moderate focus. Consider shorter, more frequent sessions.";
    else productivityInsight = "Focus needs improvement. Try the Pomodoro technique.";

    // Format sessions for frontend compatibility
    const formattedSessions = sessions.map((s) => ({
      id: s._id.toString(),
      name: s.name || s.objective || "Focus Session",
      date: new Date(s.startTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(s.startTime).getTime(),
      durationSeconds: s.durationSeconds || 0,
      distractedSeconds: s.distractedSeconds || 0,
      score: s.focusScore || 0,
      mode: s.mode,
      status: s.status === "completed_early" ? "Completed Early" : "Completed",
      distractions: {
        phone: s.distractions?.phone || 0,
        tab: s.distractions?.tab || 0,
        face: s.distractions?.face || 0,
        people: s.distractions?.people || 0,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        streakDays,
        averageFocusScore: avgFocusScore,
        totalStudySeconds,
        totalDistractedSeconds,
        totalSessions,
        weeklyTrend,
        distractionBreakdown,
        productivityInsight,
        sessions: formattedSessions,
      },
    });
  } catch (err) {
    console.error("[API] Analytics error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

function calculateStreak(sessions: Array<{ startTime: Date }>): number {
  if (sessions.length === 0) return 0;

  const studiedDates = Array.from(
    new Set(sessions.map((s) => new Date(s.startTime).toDateString()))
  )
    .map((dStr) => new Date(dStr))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const newestDate = studiedDates[0];
  if (
    newestDate.toDateString() !== today.toDateString() &&
    newestDate.toDateString() !== yesterday.toDateString()
  ) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < studiedDates.length - 1; i++) {
    const curr = studiedDates[i];
    const next = studiedDates[i + 1];
    const diffDays = Math.round((curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      break;
    }
  }
  return streak;
}
