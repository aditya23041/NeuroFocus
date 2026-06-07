import { handleMonitorEvent } from "@/lib/monitorHandler";

export async function POST(request: Request) {
  return handleMonitorEvent(request, "multiple_people", "multiple_people", "multiple_people");
}
