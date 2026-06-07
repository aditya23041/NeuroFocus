import { handleMonitorEvent } from "@/lib/monitorHandler";

export async function POST(request: Request) {
  return handleMonitorEvent(request, "phone_detected", "phone_usage", "phone_detected");
}
