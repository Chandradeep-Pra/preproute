import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-config";

const BACKEND_TESTS_PATHS = ["/tests", "/api/tests"];

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

async function fetchBackendTests(token: string) {
  for (const path of BACKEND_TESTS_PATHS) {
    const response = await fetch(getBackendUrl(path), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? ((await response.json()) as BackendPayload)
      : { message: await response.text() };

    if (!response.ok) {
      continue;
    }

    return payload;
  }

  return null;
}

async function createBackendTest(token: string, body: unknown) {
  let lastResult: { payload: BackendPayload; status: number } | null = null;

  for (const path of BACKEND_TESTS_PATHS) {
    const response = await fetch(getBackendUrl(path), {
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

    console.log("BACKEND CREATE TEST ATTEMPT", {
      url: getBackendUrl(path),
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
    const payload = await fetchBackendTests(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Unable to load tests." },
        { status: 502 },
      );
    }

    const data =
      payload && typeof payload === "object" && "data" in payload
        ? ((payload as { data?: unknown }).data ?? [])
        : [];

    return NextResponse.json({
      success: true,
      data: Array.isArray(data) ? data : [],
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to load tests." },
      { status: 502 },
    );
  }
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
    const result = await createBackendTest(token, body);

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Unable to create test." },
        { status: 502 },
      );
    }

    const { payload, status } = result;
    const message =
      payload?.message ??
      (isSuccessful(payload) ? "Test created successfully" : "Unable to create test.");
    const errors = payload?.errors ?? null;

    return NextResponse.json(
      {
        success: isSuccessful(payload),
        data: payload?.data ?? {},
        message,
        errors,
      },
      { status },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to create test.",
      },
      { status: 502 },
    );
  }
}
