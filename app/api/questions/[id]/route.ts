import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-config";

const QUESTION_PATHS = ["/questions", "/api/questions"];

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

async function updateQuestion(token: string, id: string, body: unknown) {
  let lastResult: { payload: BackendPayload; status: number } | null = null;

  for (const path of QUESTION_PATHS) {
    const url = getBackendUrl(`${path}/${encodeURIComponent(id)}`);
    const response = await fetch(url, {
      method: "PUT",
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

    console.log("BACKEND QUESTION UPDATE ATTEMPT", {
      url,
      status: response.status,
      ok: response.ok,
      payload,
      body,
    });

    if (response.ok && isSuccessful(payload)) {
      return { payload, status: response.status };
    }

    lastResult = { payload, status: response.status };
  }

  return lastResult;
}

export async function PUT(
  request: Request,
  { params }: RouteContext<"/api/questions/[id]">,
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
    const { id } = await params;
    const body = await request.json();
    const result = await updateQuestion(token, id, body);

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Unable to update question." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        success: result.payload.success === true || result.payload.status === "success",
        data: result.payload.data ?? {},
        message:
          result.payload.message ??
          (result.payload.success === true || result.payload.status === "success"
            ? "Question updated successfully"
            : "Unable to update question."),
        errors: result.payload.errors ?? null,
      },
      { status: result.status },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to update question.",
      },
      { status: 502 },
    );
  }
}
