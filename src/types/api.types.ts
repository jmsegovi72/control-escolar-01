export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
  meta?: {
    totalRecords?: number;
    totalPages?: number;
    currentPage?: number;
    limit?: number;
  };
  total?: number;
  page?: number;
  limit?: number;
}
