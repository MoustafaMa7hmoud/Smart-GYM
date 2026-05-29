export interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
}

export function extractItems<T>(response: any): T[] {
  const data = response?.data;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export function extractData<T>(response: any): T | null {
  return response?.data ?? null;
}

export function extractMeta(response: any) {
  return response?.data?.total != null || response?.meta ? {
    total: response?.data?.total ?? response?.meta?.total ?? 0,
    page: response?.data?.page ?? response?.meta?.page ?? 1,
    limit: response?.data?.limit ?? response?.meta?.limit ?? 20,
  } : null;
}
