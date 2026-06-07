import type { ProductivityGrade, ProductivityStatus } from "./types";

// ============================================================
// Focus Score Engine
// Calculates focus score based on incoming monitor events.
// ============================================================

export type MonitorEventType =
  | "face_present"
  | "phone_detected"
  | "face_missing"
  | "multiple_people"
  | "looking_away"
  | "poor_posture";

const SCORE_DELTAS: Record<MonitorEventType, number> = {
  face_present: +1,
  phone_detected: -10,
  face_missing: -5,
  multiple_people: -15,
  looking_away: -8,
  poor_posture: -3,
};

export class FocusScoreEngine {
  private score: number;
  private distractedSeconds: number;
  private totalSeconds: number;
  private distractionCounts: Record<string, number>;

  constructor(initialScore: number = 100) {
    this.score = initialScore;
    this.distractedSeconds = 0;
    this.totalSeconds = 0;
    this.distractionCounts = {};
  }

  /**
   * Apply a monitor event to adjust the focus score.
   */
  applyEvent(eventType: MonitorEventType): number {
    const delta = SCORE_DELTAS[eventType] ?? 0;
    this.score = Math.min(100, Math.max(0, this.score + delta));

    // Track distraction counts
    if (delta < 0) {
      this.distractionCounts[eventType] = (this.distractionCounts[eventType] || 0) + 1;
      this.distractedSeconds += 1;
    }

    this.totalSeconds += 1;
    return this.score;
  }

  getScore(): number {
    return this.score;
  }

  getDistractionFreePercentage(): number {
    if (this.totalSeconds === 0) return 100;
    return Math.max(0, Math.round(((this.totalSeconds - this.distractedSeconds) / this.totalSeconds) * 100));
  }

  getProductivityStatus(): ProductivityStatus {
    if (this.score >= 85) return "High";
    if (this.score >= 65) return "Optimal";
    return "Distracted";
  }

  getDistractionCounts(): Record<string, number> {
    return { ...this.distractionCounts };
  }

  getTotalDistractions(): number {
    return Object.values(this.distractionCounts).reduce((sum, c) => sum + c, 0);
  }

  getDistratedSeconds(): number {
    return this.distractedSeconds;
  }

  setScore(score: number): void {
    this.score = Math.min(100, Math.max(0, score));
  }
}

/**
 * Calculate productivity grade from a focus score (0-100).
 */
export function calculateGrade(score: number): ProductivityGrade {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

// ============================================================
// Per-session engine store (in-memory, keyed by sessionId)
// ============================================================

const sessionEngines = new Map<string, FocusScoreEngine>();

export function getOrCreateEngine(sessionId: string): FocusScoreEngine {
  let engine = sessionEngines.get(sessionId);
  if (!engine) {
    engine = new FocusScoreEngine(100);
    sessionEngines.set(sessionId, engine);
  }
  return engine;
}

export function removeEngine(sessionId: string): void {
  sessionEngines.delete(sessionId);
}
