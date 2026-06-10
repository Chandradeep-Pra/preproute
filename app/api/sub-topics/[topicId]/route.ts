import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackendJson } from "@/lib/backend";

const SUB_TOPIC_URLS = [
  (topicId: string) => `/sub-topics/topic/${encodeURIComponent(topicId)}`,
  (topicId: string) => `/api/sub-topics/topic/${encodeURIComponent(topicId)}`,
];

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/sub-topics/[topicId]">,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("preproute_session")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const { topicId } = await params;
    let payload: { success: boolean; data: unknown[] } | null = null;

    for (const buildPath of SUB_TOPIC_URLS) {
      try {
        payload = await fetchBackendJson<{
          success: boolean;
          data: unknown[];
        }>(buildPath(topicId), token);
        break;
      } catch {
        payload = null;
      }
    }

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Unable to load sub-topics." },
        { status: 502 },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to load sub-topics.",
      },
      { status: 502 },
    );
  }
}
