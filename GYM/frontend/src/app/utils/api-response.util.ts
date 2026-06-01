export interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
}

export function extractItems<T>(response: any): T[] {
  const data = response?.data ?? response;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.users)) return data.users;
  if (Array.isArray(data.trainers)) return data.trainers;
  if (Array.isArray(data.machines)) return data.machines;
  if (Array.isArray(data.subscriptions)) return data.subscriptions;
  if (Array.isArray(data.logs)) return data.logs;
  return [];
}

export function extractData<T>(response: any): T | null {
  return response?.data ?? null;
}

export function extractMeta(response: any) {
  const data = response?.data;
  const hasTotal =
    (data && typeof data === 'object' && !Array.isArray(data) && data.total != null) ||
    response?.meta?.total != null;
  if (!hasTotal) return null;
  return {
    total: (typeof data === 'object' && !Array.isArray(data) ? data.total : undefined)
      ?? response?.meta?.total
      ?? 0,
    page: data?.page ?? response?.meta?.page ?? 1,
    limit: data?.limit ?? response?.meta?.limit ?? 20,
  };
}

export function extractPagedList<T>(response: any): { items: T[]; total: number } {
  const items = extractItems<T>(response);
  const meta = extractMeta(response);
  return { items, total: meta?.total ?? items.length };
}
