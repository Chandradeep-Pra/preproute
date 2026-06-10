import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-config";

const BACKEND_QUESTION_PATHS = ["/questions/bulk", "/api/questions/bulk"];

type BackendPayload = {
  success?: boolean;
  status?: string;
  data?: unknown;
  message?: string;
  errors?: unknown;
};

function isSuccessful(payload: BackendPayload | null) {
  return payload?.success === true || payload?.status === "success";
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("preproute_session")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    let lastResult: { payload: BackendPayload; status: number } | null = null;

    for (const path of BACKEND_QUESTION_PATHS) {
      const url = getBackendUrl(path);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? ((await response.json()) as BackendPayload)
        : { message: await response.text() };

      console.log("BACKEND QUESTION BULK ATTEMPT", {
        url,
        status: response.status,
        ok: response.ok,
        payload,
        body,
      });

      if (response.ok && isSuccessful(payload)) {
        return NextResponse.json(
          {
            success: true,
            data: payload.data ?? [],
            message: payload.message ?? "Successfully created questions",
            errors: payload.errors ?? null,
          },
          { status: response.status },
        );
      }

      lastResult = { payload, status: response.status };
    }

    if (!lastResult) {
      return NextResponse.json(
        { success: false, message: "Unable to save questions." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        data: lastResult.payload.data ?? [],
        message:
          lastResult.payload.message ?? "Unable to save questions.",
        errors: lastResult.payload.errors ?? null,
      },
      { status: lastResult.status },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to save questions.",
      },
      { status: 502 },
    );
  }
}
