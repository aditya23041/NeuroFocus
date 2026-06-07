import { handleMonitorEvent } from "@/lib/monitorHandler";

export async function POST(request: Request) {
  return handleMonitorEvent(request, "poor_posture", "posture_issue", "posture_detected");
}
