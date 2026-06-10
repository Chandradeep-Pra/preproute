import { getBackendBaseUrl } from "./backend-config";

type BackendErrorPayload = {
  message?: string;
  error?: string;
};

function isBackendErrorPayload(
  value: unknown,
): value is BackendErrorPayload {
  return Boolean(value && typeof value === "object");
}

export async function fetchBackendJson<T>(path: string, token: string) {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as T | BackendErrorPayload)
    : ({ message: await response.text() } as BackendErrorPayload);

  if (!response.ok) {
    const error = isBackendErrorPayload(payload)
      ? payload.message ?? payload.error ?? "Request failed."
      : "Request failed.";

    throw new Error(error);
  }

  return payload as T;
}
