import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackendJson } from "@/lib/backend";

const TOPIC_URLS = [
  (subjectId: string) => `/topics/subject/${encodeURIComponent(subjectId)}`,
  (subjectId: string) => `/api/topics/subject/${encodeURIComponent(subjectId)}`,
];

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/topics/[subjectId]">,
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
    const { subjectId } = await params;
    let payload: { success: boolean; data: unknown[] } | null = null;

    for (const buildPath of TOPIC_URLS) {
      try {
        payload = await fetchBackendJson<{
          success: boolean;
          data: unknown[];
        }>(buildPath(subjectId), token);
        break;
      } catch {
        payload = null;
      }
    }

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Unable to load topics." },
        { status: 502 },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to load topics.",
      },
      { status: 502 },
    );
  }
}
