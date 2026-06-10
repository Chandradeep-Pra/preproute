export type TestItem = {
  id: string;
  name: string;
  subject: string;
  topics: string[];
  status: string;
  created_at: string;
};

export type TestsApiResponse = {
  success: boolean;
  data: TestItem[];
  message?: string;
};

export type TestDetail = TestItem & {
  questions?: string[];
  total_questions?: number;
  total_marks?: number;
  subject?: string;
  topics?: string[];
  sub_topics?: string[];
};

export type TestDetailResponse = {
  success: boolean;
  data: TestDetail;
  message?: string;
};

export type UpdateTestPayload = {
  name?: string;
  questions?: string[];
  total_questions?: number;
  total_marks?: number;
  status?: string;
};
