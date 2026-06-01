import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { extractItems } from '../utils/api-response.util';

const API = environment.apiUrl;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number; };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private http = inject(HttpClient);
  login(email: string, password: string) {
    return this.http.post<ApiResponse<{ token: string; user: any }>>(`${API}/auth/login`, { email, password });
  }
  register(data: any) {
    return this.http.post<ApiResponse<{ token: string; user: any }>>(`${API}/auth/register`, data);
  }
}

// ─── User ─────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);
  /** GET /api/v1/users/profile */
  getMe(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/users/profile`);
  }
  /** PATCH /api/v1/users/profile */
  updateMe(data: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${API}/users/profile`, data);
  }
  /** PATCH /api/v1/users/change-password */
  changePassword(data: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${API}/users/change-password`, data);
  }
  /** PATCH /api/v1/users/avatar */
  uploadAvatar(file: File): Observable<ApiResponse<any>> {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.http.patch<ApiResponse<any>>(`${API}/users/avatar`, fd);
  }
  /** POST /api/v1/users/favorites/:id */
  addFavourite(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API}/users/favorites/${id}`, {});
  }
  /** DELETE /api/v1/users/favorites/:id */
  removeFavourite(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${API}/users/favorites/${id}`);
  }
  /** GET /api/v1/subscriptions/my */
  getMySubscription(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/subscriptions/my`);
  }
}

// ─── Exercises ────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ExerciseApiService {
  private http = inject(HttpClient);
  /** Returns array directly for convenience */
  getAll(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any[]>>(`${API}/exercises`, { params: p }).pipe(
      map(extractItems)
    );
  }
  getById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/exercises/${id}`);
  }
  create(data: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API}/exercises`, data);
  }
  update(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${API}/exercises/${id}`, data);
  }
  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${API}/exercises/${id}`);
  }
}

// ─── Machines ─────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class MachineApiService {
  private http = inject(HttpClient);
  getAll(params?: any): Observable<ApiResponse<any[]>> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any[]>>(`${API}/machines`, { params: p });
  }
  getById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/machines/${id}`);
  }
  create(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API}/machines`, data);
  }
  update(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${API}/machines/${id}`, data);
  }
  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${API}/machines/${id}`);
  }
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SubscriptionApiService {
  private http = inject(HttpClient);
  /** GET /api/v1/subscriptions/plans */
  getPlans(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/subscriptions/plans`);
  }
  /**
   * POST /api/v1/subscriptions
   * Backend expects an object with plan and durationMonths. We accept extra fields (e.g. trainerId)
   * so the frontend can pass an optional trainer association when creating a subscription.
   */
  create(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API}/subscriptions`, data);
  }
  /** GET /api/v1/subscriptions/my — returns active subscription or null */
  getMy(bustCache = false): Observable<ApiResponse<any>> {
    const params = bustCache ? { _t: String(Date.now()) } : undefined;
    return this.http.get<ApiResponse<any>>(`${API}/subscriptions/my`, { params });
  }
  getById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/subscriptions/${id}`);
  }
  cancel(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${API}/subscriptions/${id}/cancel`, {});
  }
  getAll(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any>>(`${API}/subscriptions`, { params: p }).pipe(
      map(extractItems)
    );
  }
}

// ─── Payments ─────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private http = inject(HttpClient);
  /** POST /api/v1/payments/initiate
   * Accepts `subscriptionId` and optional `data` object with extra fields (e.g. userPhone, userFullName).
   */
  initiate(subscriptionId: string, data?: any): Observable<ApiResponse<any>> {
    const payload = { subscriptionId, ...(data || {}) };
    return this.http.post<ApiResponse<any>>(`${API}/payments/initiate`, payload);
  }
  /** GET /api/v1/payments/my */
  getMy(bustCache = false): Observable<any[]> {
    const params = bustCache ? { _t: String(Date.now()) } : undefined;
    return this.http.get<ApiResponse<any>>(`${API}/payments/my`, { params }).pipe(
      map(extractItems)
    );
  }
  getById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/payments/${id}`);
  }
  getAll(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any>>(`${API}/payments`, { params: p }).pipe(
      map(extractItems)
    );
  }
}

// ─── Attendance ───────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AttendanceApiService {
  private http = inject(HttpClient);
  /**
   * POST /api/v1/attendance/check-in
   * Frontend sends NOTHING — server sets checkIn = new Date() automatically.
   * Optional: { notes: string }
   */
  checkIn(notes?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API}/attendance/check-in`, notes ? { notes } : {});
  }
  /**
   * PATCH /api/v1/attendance/check-out
   * Frontend sends NOTHING — server sets checkOut = new Date() automatically.
   */
  checkOut(notes?: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${API}/attendance/check-out`, notes ? { notes } : {});
  }
  /** GET /api/v1/attendance/my → { data: { logs: [], total, page, limit } } */
  getMy(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any>>(`${API}/attendance/my`, { params: p }).pipe(
      map(extractItems)
    );
  }
  getAll(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any>>(`${API}/attendance`, { params: p }).pipe(
      map(extractItems)
    );
  }
}

// ─── Progress ─────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ProgressApiService {
  private http = inject(HttpClient);

  /**
   * POST /api/v1/progress/body
   * Body: { weight?, bodyFat?, chest?, waist?, measurementDate?, notes? }
   * At least one measurement field is required.
   */
  addBodyMeasurement(data: {
    weight?: number; bodyFat?: number;
    chest?: number; waist?: number;
    notes?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API}/progress/body`, data);
  }

  /** GET /api/v1/progress/body → { data: { measurements: [] } } */
  getBodyMeasurements(): Observable<any[]> {
    return this.http.get<ApiResponse<any>>(`${API}/progress/body`).pipe(
      map(extractItems)
    );
  }

  /**
   * POST /api/v1/progress/workout
   * Body: { exercise: ObjectId, sets: [{setNumber, reps, weight}], workoutDate?, notes? }
   */
  addWorkoutProgress(data: {
    exercise: string;
    sets: { setNumber: number; reps: number; weight?: number }[];
    workoutPlan?: string;
    date?: string;
    notes?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API}/progress/workout`, data);
  }

  /** GET /api/v1/progress/workout → { data: { items: [] } } */
  getWorkoutProgress(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any>>(`${API}/progress/workout`, { params: p }).pipe(
      map(extractItems)
    );
  }

  /** GET /api/v1/progress/stats */
  getStats(exerciseId?: string): Observable<ApiResponse<any>> {
    let p = new HttpParams();
    if (exerciseId) p = p.set('exerciseId', exerciseId);
    return this.http.get<ApiResponse<any>>(`${API}/progress/stats`, { params: p });
  }
}

// ─── Workout Plans ────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class WorkoutPlanApiService {
  private http = inject(HttpClient);
  /** GET /api/v1/workout-plans → { data: { plans: [] } } */
  getAll(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any>>(`${API}/workout-plans`, { params: p }).pipe(
      map(extractItems)
    );
  }
  getById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/workout-plans/${id}`);
  }
  generate(data: { goal: string; level: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API}/workout-plans`, data);
  }
  update(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${API}/workout-plans/${id}`, data);
  }
  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${API}/workout-plans/${id}`);
  }
}

// ─── Trainers ─────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TrainerApiService {
  private http = inject(HttpClient);
  getAll(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any[]>>(`${API}/trainers`, { params: p }).pipe(
      map(extractItems)
    );
  }
  getById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/trainers/${id}`);
  }
  update(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${API}/trainers/${id}`, data);
  }
  approve(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${API}/trainers/${id}/approve`, {});
  }
  create(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API}/trainers`, data);
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  getDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/admin/dashboard`);
  }
  /** GET /api/v1/users  (admin) */
  getAllUsers(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any>>(`${API}/admin/users`, { params: p }).pipe(
      map(extractItems)
    );
  }
  getUserById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/admin/users/${id}`);
  }
  deactivateUser(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/users/${id}/deactivate`, {});
  }
  activateUser(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/users/${id}/activate`, {});
  }
  getAllAttendance(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any>>(`${API}/attendance`, { params: p }).pipe(
      map(extractItems)
    );
  }
  getAllSubscriptions(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any>>(`${API}/subscriptions`, { params: p }).pipe(
      map(extractItems)
    );
  }
  getAllPayments(params?: any): Observable<ApiResponse<any>> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<ApiResponse<any>>(`${API}/payments`, { params: p });
  }
}
