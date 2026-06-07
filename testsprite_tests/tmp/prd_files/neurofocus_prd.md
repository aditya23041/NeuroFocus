# Product Requirements Document (PRD)
# NeuroFocus AI — Precision Study Monitor v4.0

## 1. Product Overview

**Product Name:** NeuroFocus AI — Precision Study Monitor  
**Version:** 4.0  
**Tech Stack:** Next.js 15 (App Router), TypeScript, TensorFlow.js (COCO-SSD + BlazeFace), Recharts, Vanilla CSS (Tailwind utility classes)  
**Base URL:** http://localhost:3000  

**Summary:**  
NeuroFocus AI is a browser-based cognitive load and focus monitoring application that uses AI computer vision (YOLO/COCO-SSD + BlazeFace face detection) via the webcam to detect distractions in real-time during study sessions. The app scores focus quality, tracks distracted time, logs session history, and provides an analytics dashboard with AI-powered cognitive insights.

---

## 2. Application Routes & Pages

| Route | Component | Purpose |
|---|---|---|
| `/` | `AnalyticsPage` | Dashboard with performance analytics, session history, streak tracker, charts, achievements |
| `/setup` | `SetupPage` | Configure and start a new study session (mode, goal, duration, camera calibration) |
| `/monitor` | `MonitorPage` | Live real-time study monitoring with AI webcam feed, focus score dial, distraction alerts |

---

## 3. Page-Level Features

### 3.1 Analytics Dashboard (`/`)

#### 3.1.1 Stats Summary Row
- **Average Focus Score**: Computed average from all sessions stored in `localStorage` (`neurofocus_sessions`).
- **Total Distracted Time**: Sum of `distractedSeconds` across all sessions.
- **Streak Tracker**: Shows consecutive study days (days with at least one session).
- **Productivity Insight Banner**: Dynamic text message based on average score threshold (≥85%, ≥70%, <70%).

#### 3.1.2 Charts
- **Weekly Focus Trend (AreaChart)**: Shows daily average focus score for the last 7 days. Renders using Recharts `AreaChart`. When no real sessions exist, shows fallback stub data. Includes a custom tooltip.
- **Distraction Breakdown (PieChart)**: Donut chart showing percentage split of Phone Use, Tab Switching, and Face Sensor Absence. Center overlay shows "3 Sensors". Includes a legend with color swatches.

#### 3.1.3 Today's Schedule
- Static timeline of hardcoded study blocks (Machine Learning Basics, Deep Work Focus Session, Review Notes) with Done/In Progress/Upcoming status badges.

#### 3.1.4 Recent Sessions List
- Filterable list of sessions (tabs: All / Work / Study).
- Each row shows: session icon (timer for pomodoro, psychology for deep-work/custom), session name, date, duration, focus score progress bar.
- Source: `localStorage.getItem("neurofocus_sessions")`.
- Default seed sessions: SESS-101 through SESS-104.

#### 3.1.5 Achievement Badges
- Five badges: Consistency King, Focus Master, Zero Distractions, Calibrated Mind, Night Owl.
- Unlocked state computed dynamically from session data.
- Locked badges render at 50% opacity.

#### 3.1.6 AI Cognitive Performance Report Modal
- Triggered by "AI Report" button.
- Displays: Avg Focus Index, Total Distracted time, Streak status, Cognitive Trend text, Distraction Source Breakdown text, Personalized Recommendations.
- Actions: Print Report (triggers `window.print()`), Close Report.

#### 3.1.7 Export Actions
- **Export CSV**: Downloads a CSV file of all sessions using a dynamically-created anchor element.
- **Export PDF**: Triggers `window.print()`.

---

### 3.2 Session Setup (`/setup`)

#### 3.2.1 Focus Mode Selection
Three selectable cards (radio-button-like behavior):
- **Pomodoro**: Sets duration to 25 minutes. Icon: `timer`.
- **Deep Work** (default): Sets duration to 90 minutes. Icon: `psychology`.
- **Custom**: Manual duration, no auto-set. Icon: `tune`.

#### 3.2.2 Goal & Duration Configuration
- **Primary Goal Text Input** (`id="objective"`): Free-text session goal.
- **Duration Slider**: Range 15–180 minutes, step 5. Displays current value above.

#### 3.2.3 AI Calibration Panel (Camera Preview)
- Toggle button to start/stop webcam feed preview.
- Status badge: Offline → Calibrating… → Active.
- Scan animation overlay shown while calibrating.
- Setup checklist (static): face lighting, camera at eye level, reflections.

#### 3.2.4 Start Session
- Button (`id="setup-start-btn"`): Navigates to `/monitor?mode=...&goal=...&duration=...`.

---

### 3.3 Live Monitor (`/monitor`)

#### 3.3.1 Session Configuration (via Query Params)
- `mode`: `"pomodoro"` | `"deep-work"` | `"custom"` (default: `"deep-work"`)
- `goal`: session goal string (default: `"Focus Session"`)
- `duration`: integer in minutes (default: 60)

#### 3.3.2 AI Models
- **COCO-SSD (lite_mobilenet_v2)**: Detects cell phones and persons.
- **BlazeFace**: Detects face landmarks and bounding boxes.
- Both models are loaded in parallel via `Promise.all` on mount.
- Loading state shown with spinner overlay ("Loading YOLO & BlazeFace Models…").

#### 3.3.3 Webcam Feed & Bounding Box Canvas
- Webcam stream started via `navigator.mediaDevices.getUserMedia`.
- Video element: horizontally flipped (`-scale-x-100`), covers full card.
- Canvas overlay: real-time bounding boxes drawn per-frame.
  - Face: green (`#10b981`) bounding box + landmark dots.
  - Phone: red (`#ef4444`) bounding box.
- Privacy Mode toggle: blurs/hides canvas, dims video feed.

#### 3.3.4 Focus Score Dial
- Circular SVG progress ring showing time remaining fraction.
- Inner display: numeric focus score (%) + status label (Focused / Distracted / Face Missing / Tab Switch).
- Ring color: green (secondary) when focused, red (error) when any distraction active.
- Label: "Focus Pulse" with "● Live" dot.

#### 3.3.5 Countdown Timer
- Displayed in MM:SS or HH:MM:SS format below the dial.
- Counts down every second when `isActive === true`.

#### 3.3.6 Session Controls
- **Pause/Resume** button: toggles `isActive`.
- **Reset** button: resets timer, elapsed, distracted seconds, and focus score to initial.
- **End & Save Session** button: stops camera, saves session to localStorage (if `elapsedSeconds > 5`), then redirects to `/`.

#### 3.3.7 Distraction Detection
Three distraction types tracked per second:
1. **Phone Detected** (`phoneDetected`): COCO-SSD detects `"cell phone"`.
2. **Face Not Detected** (`!faceDetected`): BlazeFace returns no predictions (with COCO person fallback).
3. **Tab Switch** (`isTabDistracted`): `document.visibilitychange` event fires when tab becomes hidden.

#### 3.3.8 Voice Alerts (SpeechSynthesis)
- Triggered on state change transitions (not every second).
- "Face not detected. Please return to your screen." (face disappears)
- "Mobile phone detected. Please avoid distraction." (phone appears)
- "Tab switch detected. Please refocus on your study goals." (tab hides)

#### 3.3.9 Toast Notifications
- Face Alert: red border, bouncing, with close button.
- Phone Alert: amber border, bouncing, with close button.
- Tab Alert: primary/purple border, bouncing, with close button (only visible while tab is hidden — so practically only briefly visible on return).

#### 3.3.10 Stats HUD (Bottom Section)
- Elapsed time, Distracted seconds, Distraction-Free %, Productivity level (High/Optimal/Distracted).
- Goal progress bar showing `(elapsedSeconds / totalSeconds) * 100`.

#### 3.3.11 Focus Score Algorithm
- `distractionFreePercent = max(30, ((elapsed - distracted) / elapsed) * 100)`
- Focus score smoothly transitions toward `distractionFreePercent` by ±1 or -2 per tick.
- Clamped between 40 and 100.

#### 3.3.12 Simulator Override HUD
- HUD bar in video feed: toggleable buttons to manually override `faceDetected`, `phoneDetected`, `isTabDistracted` for testing without real distractions.

#### 3.3.13 Reminder System
- "Set Reminder" button opens a number input (5–120 minutes).
- On confirm: shows a browser alert confirming the reminder interval.

#### 3.3.14 Session Completion
- On timer reaching 0 or manual End: session saved to `localStorage`, `window.alert` confirms, redirects to `/`.
- Session schema: `id`, `name`, `date`, `timestamp`, `durationSeconds`, `distractedSeconds`, `score`, `mode`, `status`, `distractions: { phone, tab, face }`.

---

## 4. Shared Components

### 4.1 Header (`Header.tsx`)
- Fixed top bar (full width minus 16rem sidebar).
- Search input with placeholder text (contextual by route).
- Page title center (NeuroFocus AI / Session Setup / Live Monitor).
- Dark mode toggle (persists via `document.documentElement.classList`).
- Notifications button (placeholder alert).
- User avatar image.

### 4.2 Sidebar (`Sidebar.tsx`)
- Fixed left navigation: links to `/` (Analytics), `/setup` (New Session), `/monitor` (Live Monitor).
- Active state highlighted by `pathname` match.

---

## 5. Data Layer

### 5.1 localStorage Schema
**Key:** `neurofocus_sessions`  
**Value:** JSON array of session objects:
```json
[
  {
    "id": "SESS-XXXX",
    "name": "string",
    "date": "string (locale)",
    "timestamp": 1234567890000,
    "durationSeconds": 3600,
    "distractedSeconds": 300,
    "score": 87,
    "mode": "deep-work | pomodoro | custom",
    "status": "Completed | Completed Early",
    "distractions": {
      "phone": 150,
      "tab": 100,
      "face": 50
    }
  }
]
```

### 5.2 Default Seed Sessions
If `neurofocus_sessions` is not found in localStorage, four default sessions are written:
- SESS-104: Deep Work Focus, 2h 15m, score 92, 8% distraction
- SESS-103: Programming Practice, 1h 45m, score 78, 22% distraction
- SESS-102: Reading Assignment, 45m, score 45, 55% distraction
- SESS-101: Machine Learning Basics, 2h, score 95, 5% distraction

---

## 6. Non-Functional Requirements

| Aspect | Requirement |
|---|---|
| Browser Support | Modern Chromium-based browsers (Chrome, Edge); WebRTC + WebSpeech APIs required |
| Camera Permission | Required for `/setup` AI calibration and `/monitor` AI detection |
| Offline Support | Sessions stored in localStorage; no external API calls |
| Performance | COCO-SSD lite_mobilenet_v2 used for lightweight inference |
| Responsive | Grid layouts adapt from mobile (1-col) to desktop (12-col) |
| Accessibility | Semantic HTML5; ARIA labels on interactive elements |
| Privacy | Camera feed processed locally; no data sent to servers |

---

## 7. Key User Flows

### Flow 1: Start a New Study Session
1. User navigates to `/setup` via sidebar.
2. Selects focus mode (Pomodoro / Deep Work / Custom).
3. Enters study goal in text input.
4. Adjusts duration slider.
5. (Optional) Clicks "Test Camera" to preview webcam and verify calibration.
6. Clicks "Start Session" → navigates to `/monitor?mode=deep-work&goal=...&duration=90`.

### Flow 2: Complete a Live Monitor Session
1. `/monitor` loads with query params.
2. COCO-SSD and BlazeFace models load asynchronously.
3. Webcam stream starts; bounding boxes appear.
4. Timer counts down; focus score updates every second.
5. If phone appears → red toast + voice alert.
6. If face disappears → red toast + voice alert.
7. If tab switches → purple toast + voice alert (tab visibility API).
8. User clicks "End & Save Session" or timer reaches 0 → session saved → redirected to `/`.

### Flow 3: Review Analytics Dashboard
1. User navigates to `/` (Analytics).
2. Stats panels show avg focus score, total distracted time, streak count.
3. Weekly focus area chart renders from session data.
4. Distraction breakdown donut chart renders.
5. User filters recent sessions by tab (All / Work / Study).
6. User clicks "AI Report" → modal opens with personalized insights.
7. User exports CSV or PDF.

---

## 8. Edge Cases & Known Behaviors

| Behavior | Description |
|---|---|
| Short session < 5s | "Session too short to save" shown; not persisted to localStorage |
| Camera denied | Alert shown; camera shows offline state; monitor continues without vision |
| Models fail to load | `modelLoading` set to false; detection silently skipped each frame |
| No sessions in localStorage | Default SESS-101 to SESS-104 seeded on first Analytics page load |
| Tab alert closed manually | Toast dismissible; distracted seconds still tracked |
| Privacy mode | Canvas hidden; video blurred; AI continues analyzing in background |
| Streak calculator | Requires session on today or yesterday; consecutive days must be exactly 1 day apart |
