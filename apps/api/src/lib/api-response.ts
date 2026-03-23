import type { ApiResponse, PaginationMeta } from '@context-sync/shared';

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data, error: null };
}

export function fail(error: string): ApiResponse<null> {
  return { success: false, data: null, error };
}

export function failWithData<T>(error: string, data: T): ApiResponse<T> {
  return { success: false, data, error };
}

export function paginated<T>(data: T, meta: PaginationMeta): ApiResponse<T> {
  return { success: true, data, error: null, meta };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
