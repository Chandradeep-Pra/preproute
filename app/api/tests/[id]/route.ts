import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend-config";
import { fetchBackendJson } from "@/lib/backend";
import type { TestDetailResponse, UpdateTestPayload } from "@/lib/tests";

type BackendDetailPayload = {
  success?: boolean;
  status?: string;
  data?: TestDetailResponse["data"];
  message?: string;
};

const TEST_DETAIL_URLS = [
  (id: string) => `/tests/${encodeURIComponent(id)}`,
  (id: string) => `/api/tests/${encodeURIComponent(id)}`,
];

async function proxyTestDetail(token: string, id: string) {
  for (const buildPath of TEST_DETAIL_URLS) {
    try {
      const payload = await fetchBackendJson<BackendDetailPayload>(
        buildPath(id),
        token,
      );

      return payload?.data ?? null;
    } catch {
      continue;
    }
  }

  return null;
}

async function updateTest(
  token: string,
  id: string,
  body: UpdateTestPayload,
) {
  let lastResult: {
    status: number;
    payload: { success?: boolean; status?: string; data?: unknown; message?: string };
  } | null = null;

  for (const buildPath of TEST_DETAIL_URLS) {
    const response = await fetch(
      `${getBackendBaseUrl()}${buildPath(id)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? ((await response.json()) as {
          success?: boolean;
          status?: string;
          data?: unknown;
          message?: string;
        })
      : { message: await response.text() };

    if (response.ok && (payload.success === true || payload.status === "success")) {
      return { status: response.status, payload };
    }

    lastResult = { status: response.status, payload };
  }

  return lastResult;
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/tests/[id]">,
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
    console.log("API TEST DETAIL REQUEST", { id });
    const data = await proxyTestDetail(token, id);

    console.log("API TEST DETAIL RESPONSE", {
      id,
      hasData: Boolean(data),
      data,
    });

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Unable to load test." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to load test.",
      },
      { status: 502 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext<"/api/tests/[id]">,
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
    const body = (await request.json()) as UpdateTestPayload;
    const result = await updateTest(token, id, body);

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Unable to update test." },
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
            ? "Test updated successfully"
            : "Unable to update test."),
      },
      { status: result.status },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to update test.",
      },
      { status: 502 },
    );
  }
}
