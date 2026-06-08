export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
  total?: number;
  page?: number;
  limit?: number;
}
