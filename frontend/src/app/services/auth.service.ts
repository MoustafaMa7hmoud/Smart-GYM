import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

export interface AppUser {
  _id: string; fullName: string; email: string;
  role: 'user' | 'trainer' | 'admin';
  phone?: string; gender?: string; goal?: string; level?: string;
  weight?: number; height?: number; profileImage?: string; joinDate?: string;
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _user$ = new BehaviorSubject<AppUser | null>(this.loadUser());
  currentUser$   = this._user$.asObservable();

  private loadUser(): AppUser | null {
    try { const u = localStorage.getItem('gym_user'); return u ? JSON.parse(u) : null; }
    catch { return null; }
  }

  get currentUser()  { return this._user$.value; }
  get isLoggedIn()   { return !!localStorage.getItem('gym_token'); }
  get token()        { return localStorage.getItem('gym_token'); }
  get userRole()     { return this._user$.value?.role ?? ''; }

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

  logout() {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    this._user$.next(null);
    this.router.navigate(['/login']);
  }
}
