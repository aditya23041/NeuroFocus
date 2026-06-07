# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata

| Field | Value |
|---|---|
| **Project Name** | NeuroFocus AI – Study Monitor 4.0 |
| **Date** | 2026-06-06 |
| **Prepared by** | TestSprite AI Team |
| **Test Type** | Frontend (Playwright) |
| **Server Mode** | Development (Next.js dev server, port 3000) |
| **Total Tests Run** | 15 |
| **Pass Rate** | 80% (12 Passed / 2 Failed / 1 Blocked) |

---

## 2️⃣ Requirement Validation Summary

### 📊 Analytics Dashboard

#### ✅ TC003 — Review dashboard summary and weekly performance trends
- **Test Code:** [TC003_Review_dashboard_summary_and_weekly_performance_trends.py](./tmp/TC003_Review_dashboard_summary_and_weekly_performance_trends.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/a3561a44-fb84-43c2-8868-810718a20eec)
- **Status:** ✅ Passed
- **Analysis:** The weekly focus trend area chart and all dashboard summary widgets (avg focus score, streak tracker, productivity insight banner) rendered correctly and displayed data from localStorage sessions.

---

#### ✅ TC009 — Browse recent sessions and filter them by category
- **Test Code:** [TC009_Browse_recent_sessions_and_filter_them_by_category.py](./tmp/TC009_Browse_recent_sessions_and_filter_them_by_category.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/670f5287-7b69-4ee3-a2ce-ac0e0a1dab2a)
- **Status:** ✅ Passed
- **Analysis:** Session list filtering using the All / Work / Study tab buttons works correctly. Sessions are displayed and filtered by mode (`pomodoro` → Study, `deep-work`/`custom` → Work) as expected.

---

#### ✅ TC011 — View unlocked achievement badges on the dashboard
- **Test Code:** [TC011_View_unlocked_achievement_badges_on_the_dashboard.py](./tmp/TC011_View_unlocked_achievement_badges_on_the_dashboard.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/85c33e20-a046-420b-b675-8e3223a2a97a)
- **Status:** ✅ Passed
- **Analysis:** Unlocked badges (Focus Master, Zero Distractions, Calibrated Mind) rendered correctly with their colored icons and descriptive text.

---

#### ❌ TC010 — View unlocked and locked achievements on the dashboard
- **Test Code:** [TC010_View_unlocked_and_locked_achievements_on_the_dashboard.py](./tmp/TC010_View_unlocked_and_locked_achievements_on_the_dashboard.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/f0e264d5-f7f9-487c-aa9d-4fa4405da04c)
- **Status:** ❌ Failed
- **Error:** Locked-state indicators for achievements are not visually distinguishable. The UI renders all 5 achievements but locked ones have no explicit lock icon or "Locked" label — they only differ via greyed-out opacity/color, which the test runner could not identify as a locked state.
- **Analysis:** The locked state is communicated purely through CSS styling (`opacity-50`, greyed color tokens) without an accessible label, icon, or `aria-label`. This causes the automated test to be unable to confirm the locked state. **Recommendation:** Add a `lock` icon or `aria-disabled` attribute to locked badges for accessibility and testability.

---

#### ❌ TC015 — Export study history as CSV
- **Test Code:** [TC015_Export_study_history_as_CSV.py](./tmp/TC015_Export_study_history_as_CSV.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/1c32ab58-3e00-484e-adf7-7da4b823bf25)
- **Status:** ❌ Failed
- **Error:** The "Export CSV" button could not be isolated by the test runner — the interactive element enumeration returned only one button index [81] which mapped to the "AI Report" button instead of "Export CSV". The buttons lack unique `id` attributes causing element selection ambiguity.
- **Analysis:** The three action buttons (AI Report, Export CSV, Export PDF) in the analytics header have no unique `id` attributes, making them difficult to target individually. **Recommendation:** Add `id="export-csv-btn"`, `id="export-pdf-btn"`, `id="ai-report-btn"` to these buttons.

---

### 🤖 AI Productivity Report Modal

#### ✅ TC006 — Open the AI productivity report from the dashboard
- **Test Code:** [TC006_Open_the_AI_productivity_report_from_the_dashboard.py](./tmp/TC006_Open_the_AI_productivity_report_from_the_dashboard.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/6f6abc4b-3dcb-44a8-80d4-081f739ab67d)
- **Status:** ✅ Passed
- **Analysis:** Clicking the "AI Report" button successfully opened the glassmorphic modal. All three stat values (Avg Focus Index, Total Distracted, Streak Status) rendered with correct data.

---

#### ✅ TC007 — Open and close the AI productivity report
- **Test Code:** [TC007_Open_and_close_the_AI_productivity_report.py](./tmp/TC007_Open_and_close_the_AI_productivity_report.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/dd0b1b44-cdfe-43a7-8b66-74abff435a7b)
- **Status:** ✅ Passed
- **Analysis:** Modal open/close cycle works correctly. The close button dismisses the modal and the dashboard is restored to its normal state.

---

#### ✅ TC013 — Review study recommendations in the AI report
- **Test Code:** [TC013_Review_study_recommendations_in_the_AI_report.py](./tmp/TC013_Review_study_recommendations_in_the_AI_report.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/d5bbda58-66cc-4304-a9af-a1fa05048150)
- **Status:** ✅ Passed
- **Analysis:** All three recommendation sections (Cognitive Trend Analysis, Distraction Source Breakdown, Personalized Study Recommendations) rendered with dynamic data populated from session history.

---

### ⚙️ Session Setup

#### ✅ TC002 — Start a session from setup with a chosen focus mode
- **Test Code:** [TC002_Start_a_session_from_setup_with_a_chosen_focus_mode.py](./tmp/TC002_Start_a_session_from_setup_with_a_chosen_focus_mode.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/61db9a08-8f1e-4b99-ad4c-5f0553efcdaa)
- **Status:** ✅ Passed
- **Analysis:** Focus mode selection (Pomodoro, Deep Work, Custom), goal input, duration slider, and navigation to `/monitor` with correct query params all work as expected.

---

#### ✅ TC004 — Set up a deep work session and begin monitoring
- **Test Code:** [TC004_Set_up_a_deep_work_session_and_begin_monitoring.py](./tmp/TC004_Set_up_a_deep_work_session_and_begin_monitoring.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/71acee93-da7a-4327-983c-97b985d160f2)
- **Status:** ✅ Passed
- **Analysis:** Deep Work mode (90m default) pre-selects correctly and navigates to the monitor page with the correct parameters.

---

#### ✅ TC005 — Set up a custom session and begin monitoring
- **Test Code:** [TC005_Set_up_a_custom_session_and_begin_monitoring.py](./tmp/TC005_Set_up_a_custom_session_and_begin_monitoring.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/bfc2d23f-90bd-47f7-b610-8d35373c884c)
- **Status:** ✅ Passed
- **Analysis:** Custom mode allows manual duration slider adjustment and correctly passes all params to the monitor route.

---

#### 🚫 TC014 — Calibrate the camera before starting a session
- **Test Code:** [TC014_Calibrate_the_camera_before_starting_a_session.py](./tmp/TC014_Calibrate_the_camera_before_starting_a_session.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/5c17d1d1-ce86-4056-ba47-29c20ae04540)
- **Status:** 🚫 Blocked
- **Error:** Browser denied camera access in the headless Playwright environment. The "Test Camera" button was clicked 3+ times but always resulted in the "Camera access denied or unavailable" alert.
- **Analysis:** This is expected behaviour in headless/automated test environments — `navigator.mediaDevices.getUserMedia()` requires real hardware and browser permission grants. This test cannot be automated without browser permission flags or mock camera injection. **Recommendation:** Use Playwright's `--use-fake-ui-for-media-stream` or mock the `getUserMedia` API for CI testing.

---

### 🖥️ Live Monitor Session

#### ✅ TC001 — View and save a live monitoring session
- **Test Code:** [TC001_View_and_save_a_live_monitoring_session.py](./tmp/TC001_View_and_save_a_live_monitoring_session.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/0606ec11-1d82-45fe-8253-d27fa0c63125)
- **Status:** ✅ Passed
- **Analysis:** The monitor page loads, the focus score dial is visible, the countdown timer runs, and the "End & Save Session" flow correctly saves to localStorage and redirects to the dashboard.

---

#### ✅ TC008 — Blur and reveal the monitor feed during a session
- **Test Code:** [TC008_Blur_and_reveal_the_monitor_feed_during_a_session.py](./tmp/TC008_Blur_and_reveal_the_monitor_feed_during_a_session.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/bdd5f3f5-5985-4c66-a02a-c24b90d5a9ad)
- **Status:** ✅ Passed
- **Analysis:** The "Blur Feed" / "Reveal Feed" privacy toggle works correctly — clicking toggles the privacy overlay and updates the button label as expected.

---

#### ✅ TC012 — Set a reminder interval during a live session
- **Test Code:** [TC012_Set_a_reminder_interval_during_a_live_session.py](./tmp/TC012_Set_a_reminder_interval_during_a_live_session.py)
- **Result:** [View on TestSprite](https://www.testsprite.com/dashboard/mcp/tests/9f3a8de7-c794-4c2a-a41d-c8e447a1b292/1c49c649-b5c8-49b8-8c2a-23c9794f15df)
- **Status:** ✅ Passed
- **Analysis:** The "Set Reminder" button opens the interval popup, the number input accepts values, and the Confirm button triggers the alert and closes the popup correctly.

---

## 3️⃣ Coverage & Matching Metrics

| Requirement Group | Total Tests | ✅ Passed | ❌ Failed | 🚫 Blocked |
|---|---|---|---|---|
| Analytics Dashboard | 5 | 3 | 2 | 0 |
| AI Productivity Report Modal | 3 | 3 | 0 | 0 |
| Session Setup | 4 | 3 | 0 | 1 |
| Live Monitor Session | 3 | 3 | 0 | 0 |
| **TOTAL** | **15** | **12** | **2** | **1** |

- **Overall Pass Rate:** 80% (12/15)
- **Failure Rate:** 13.3% (2/15)
- **Blocked Rate:** 6.7% (1/15)

---

## 4️⃣ Key Gaps / Risks

### 🔴 High Priority Issues

1. **Missing unique IDs on action buttons (TC015)**
   - The "Export CSV", "Export PDF", and "AI Report" buttons in the analytics header have no unique `id` attributes.
   - This causes element selection ambiguity in automated tests and also violates accessibility best practices.
   - **Fix:** Add `id="ai-report-btn"`, `id="export-csv-btn"`, `id="export-pdf-btn"` to the three buttons in `src/app/page.tsx`.

2. **Locked achievement state is not accessible (TC010)**
   - Locked badges rely purely on CSS opacity/greyscale to communicate their locked state — no icon, ARIA attribute, or text label differentiates them from unlocked ones programmatically.
   - **Fix:** Add a `lock` Material Icon inside locked badge cards, or add `aria-label="Locked"` to the badge container.

### 🟡 Medium Priority Issues

3. **Camera access blocked in headless environments (TC014)**
   - `getUserMedia()` is always denied in headless Playwright without special browser flags or a mock.
   - **Fix for CI:** Pass `--use-fake-ui-for-media-stream` to the Playwright browser launch args. Consider mocking `navigator.mediaDevices` in the test setup for unit/component tests.

### 🟢 Low Priority Observations

4. **TensorFlow.js models (COCO-SSD, BlazeFace) not tested under load**
   - The monitor page's AI inference loop was not exercised in these tests. Under concurrent test load on the dev server, the model inference could cause browser frame drops or crashes.
   - **Recommendation:** Run monitor page tests against a production build (`npm run build && npm run start`) for stable AI model testing.

5. **localStorage seeding**
   - Tests rely on default sessions auto-seeded on first load. If localStorage is pre-populated from a previous test run with different data, analytics values may differ.
   - **Recommendation:** Add a `beforeEach` hook in test setup to clear `neurofocus_sessions` from localStorage for deterministic results.

---

*Report generated by TestSprite AI MCP — 2026-06-06*
