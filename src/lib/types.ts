// ============================================================
// Shared TypeScript types for NeuroFocus AI Backend
// ============================================================

export type FocusMode = "pomodoro" | "deep_work" | "custom";
export type SessionStatus = "active" | "completed" | "completed_early" | "cancelled";
export type ProductivityGrade = "A+" | "A" | "B" | "C" | "D";
export type ProductivityStatus = "High" | "Optimal" | "Distracted";
export type Subscription = "free" | "premium";

// --- Model interfaces ---

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  subscription: Subscription;
  createdAt: Date;
}

export interface ISessionConfig {
  _id: string;
  userId: string;
  mode: FocusMode;
  sessionDuration: number;
  objective: string;
  createdAt: Date;
}

export interface IDistractions {
  phone: number;
  tab: number;
  face: number;
  people: number;
  posture: number;
  gaze: number;
}

export interface IStudySession {
  _id: string;
  userId: string;
  name: string;
  mode: FocusMode;
  startTime: Date;
  endTime?: Date;
  status: SessionStatus;
  focusScore: number;
  distractions: IDistractions;
  durationSeconds: number;
  distractedSeconds: number;
  productivityGrade?: ProductivityGrade;
  objective: string;
}

export interface IFocusMetrics {
  _id: string;
  sessionId: string;
  focusScore: number;
  studyTime: number;
  distractedTime: number;
  distractionFreePercentage: number;
  productivityStatus: ProductivityStatus;
  goalProgress: number;
  updatedAt: Date;
}

export interface IViolation {
  _id: string;
  sessionId: string;
  violationType: string;
  source: string;
  timestamp: Date;
}

export interface IBlockedApplication {
  _id: string;
  userId: string;
  appName: string;
  executableName: string;
  enabled: boolean;
}

// --- API response types ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LiveSessionData {
  focusScore: number;
  studyTime: number;
  distractedTime: number;
  distractionFreePercentage: number;
  productivityStatus: string;
  goalProgress: number;
}

export interface AnalyticsData {
  streakDays: number;
  averageFocusScore: number;
  weeklyTrend: { day: string; focus: number }[];
  distractionBreakdown: { name: string; value: number; color: string }[];
  productivityInsight: string;
  sessions: IStudySession[];
}

export interface ReportData {
  studyTime: number;
  focusScore: number;
  distractions: number;
  blockedApps: number;
  productivityGrade: string;
}
