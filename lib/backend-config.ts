export function getBackendBaseUrl() {
  const backendBaseUrl = process.env.BACKEND_BASE_URL;

  if (!backendBaseUrl) {
    throw new Error("BACKEND_BASE_URL is not set.");
  }

  return backendBaseUrl.replace(/\/$/, "");
}

export function getBackendUrl(path: string) {
  return `${getBackendBaseUrl()}${path}`;
}
