import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend-config";

const SESSION_COOKIE = "preproute_session";
function extractToken(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const data = record.data && typeof record.data === "object"
    ? (record.data as Record<string, unknown>)
    : null;

  const candidates = [
    record.accessToken,
    record.token,
    data?.accessToken,
    data?.token,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      password?: string;
    };

    if (!body.userId?.trim() || !body.password) {
      return NextResponse.json(
        { message: "User ID and password are required." },
        { status: 400 },
      );
    }

    const backendResponse = await fetch(`${getBackendBaseUrl()}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: body.userId.trim(),
        password: body.password,
      }),
    });

    const contentType = backendResponse.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await backendResponse.json()
      : { message: await backendResponse.text() };

    if (!backendResponse.ok) {
      const message =
        payload && typeof payload === "object" && "message" in payload
          ? String((payload as { message?: unknown }).message ?? "Login failed")
          : "Login failed";

      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: backendResponse.status },
      );
    }

    const token = extractToken(payload);
    const user =
      payload && typeof payload === "object"
        ? ((payload as { data?: { user?: unknown }; user?: unknown }).data?.user ??
            (payload as { user?: unknown }).user ??
            {})
        : {};

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Login succeeded, but no session token was returned.",
        },
        { status: 502 },
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to log in right now. Please try again." },
      { status: 500 },
    );
  }
}
