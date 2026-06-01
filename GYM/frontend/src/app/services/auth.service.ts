import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

export interface AppUser {
  _id: string; fullName: string; email: string;
  role: 'user' | 'trainer' | 'admin' | 'superAdmin';
  qrToken?: string;
  phone?: string; gender?: string; goal?: string; level?: string;
  weight?: number; height?: number; profileImage?: string; joinDate?: string;
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _user$ = new BehaviorSubject<AppUser | null>(null);
  currentUser$   = this._user$.asObservable();

  constructor() { this.initSession(); }

  private loadUser(): AppUser | null {
    try { const u = localStorage.getItem('gym_user'); return u ? JSON.parse(u) : null; }
    catch { return null; }
  }

  private decodeTokenPayload(): { role?: string; type?: string; exp?: number } | null {
    const token = this.token;
    if (!token || token.startsWith('mock-jwt')) return null;
    try { return JSON.parse(atob(token.split('.')[1])); }
    catch { return null; }
  }

  /** Drop expired/mock tokens so guards and navbar stay in sync. */
  private initSession(): void {
    if (!this.hasValidToken()) {
      localStorage.removeItem('gym_token');
      localStorage.removeItem('gym_user');
      this._user$.next(null);
      return;
    }
    this._user$.next(this.loadUser());
  }

  get currentUser()  { return this._user$.value; }
  get isLoggedIn()   { return this.hasValidToken(); }
  get token()        { return localStorage.getItem('gym_token'); }

  /** Reject mock tokens, non-access JWTs, and expired sessions. */
  hasValidToken(): boolean {
    const payload = this.decodeTokenPayload();
    if (!payload) return false;
    if (payload.type && payload.type !== 'access') return false;
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  }

  get userRole(): string {
    return this._user$.value?.role ?? this.decodeTokenPayload()?.role ?? '';
  }

  isAdmin(): boolean {
    const role = this.userRole;
    return role === 'admin' || role === 'superAdmin';
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${API}/auth/login`, { email, password }).pipe(
      tap(res => { if (res.success) this.saveSession(res.data.token, res.data.user); })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(`${API}/auth/register`, data).pipe(
      tap(res => { if (res.success) this.saveSession(res.data.token, res.data.user); })
    );
  }

  private saveSession(token: string, user: AppUser) {
    localStorage.setItem('gym_token', token);
    localStorage.setItem('gym_user', JSON.stringify(user));
    this._user$.next(user);
  }

  updateCurrentUser(user: Partial<AppUser>) {
    const updated = { ...this._user$.value, ...user } as AppUser;
    localStorage.setItem('gym_user', JSON.stringify(updated));
    this._user$.next(updated);
  }

  clearSession(): void {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    this._user$.next(null);
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/login']);
  }
}
