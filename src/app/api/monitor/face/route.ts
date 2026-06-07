import { handleMonitorEvent } from "@/lib/monitorHandler";

export async function POST(request: Request) {
  return handleMonitorEvent(request, "face_present", "face_detected", "face_detected");
}
