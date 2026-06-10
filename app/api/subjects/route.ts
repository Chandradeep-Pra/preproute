import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackendJson } from "@/lib/backend";

const SUBJECT_URLS = ["/subjects", "/api/subjects"];

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("preproute_session")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    let payload: { success: boolean; data: unknown[] } | null = null;

    for (const path of SUBJECT_URLS) {
      try {
        payload = await fetchBackendJson<{
          success: boolean;
          data: unknown[];
        }>(path, token);
        break;
      } catch {
        payload = null;
      }
    }

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Unable to load subjects." },
        { status: 502 },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to load subjects.",
      },
      { status: 502 },
    );
  }
}
