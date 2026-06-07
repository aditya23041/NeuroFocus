import { handleMonitorEvent } from "@/lib/monitorHandler";

export async function POST(request: Request) {
  return handleMonitorEvent(request, "looking_away", "gaze_distraction", "gaze_detected");
}
