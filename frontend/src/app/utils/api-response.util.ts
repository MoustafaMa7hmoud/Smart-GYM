export interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
}

/**
 * Extracts an array from any backend response shape.
 * Handles all response formats used across all modules.
 */
export function extractItems<T>(response: any): T[] {
  const data = response?.data ?? response;
  if (!data) return [];

  // Direct array
  if (Array.isArray(data)) return data;

  // Module-specific array keys (match backend service return shapes)
  if (Array.isArray(data.exercises))     return data.exercises;
  if (Array.isArray(data.trainers))      return data.trainers;
  if (Array.isArray(data.plans))         return data.plans;
  if (Array.isArray(data.workoutPlans))  return data.workoutPlans;
  if (Array.isArray(data.logs))          return data.logs;        // attendance
  if (Array.isArray(data.measurements))  return data.measurements; // progress/body
  if (Array.isArray(data.subscriptions)) return data.subscriptions;
  if (Array.isArray(data.payments))      return data.payments;
  if (Array.isArray(data.users))         return data.users;
  if (Array.isArray(data.machines))      return data.machines;

  // Generic fallbacks
  if (Array.isArray(data.items))   return data.items;
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.results)) return data.results;

  return [];
}

export function extractData<T>(response: any): T | null {
  return response?.data ?? null;
}

export function extractMeta(response: any) {
  return response?.data?.total != null || response?.meta ? {
    total: response?.data?.total ?? response?.meta?.total ?? 0,
    page:  response?.data?.page  ?? response?.meta?.page  ?? 1,
    limit: response?.data?.limit ?? response?.meta?.limit ?? 20,
  } : null;
}
