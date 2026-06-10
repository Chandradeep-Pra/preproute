type ApiResponse<T> = {
  success?: boolean;
  status?: string;
  data: T[];
  message?: string;
};

export type SelectOption = {
  id: string;
  name: string;
};

async function loadOptions<T>(path: string) {
  const response = await fetch(path, { cache: "no-store" });
  const payload = (await response.json()) as ApiResponse<T>;

  const isSuccessful =
    payload.success === true || payload.status === "success";

  if (!response.ok || !isSuccessful) {
    throw new Error(payload.message ?? "Unable to load options.");
  }

  return payload.data;
}

export function fetchSubjects() {
  return loadOptions<SelectOption>("/api/subjects");
}

export function fetchTopics(subjectId: string) {
  return loadOptions<SelectOption>(`/api/topics/${subjectId}`);
}

export function fetchSubTopics(topicId: string) {
  return loadOptions<SelectOption>(`/api/sub-topics/${topicId}`);
}
