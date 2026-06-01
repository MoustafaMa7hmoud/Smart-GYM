import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AppUser } from '../../services/auth.service';

@Component({
  selector: 'app-navbar', standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html', styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  user: AppUser | null = null;
  menuOpen = false;

  ngOnInit() { this.auth.currentUser$.subscribe(u => this.user = u); }

  logout() { this.auth.logout(); }

  getDashboardRoute(): string {
    if (!this.auth.isLoggedIn) return '/login';
    if (this.auth.isAdmin()) return '/admin';
    if (this.auth.userRole === 'trainer') return '/trainer';
    return '/dashboard';
  }

  getInitials(name: string): string {
    const p = name.trim().split(/\s+/);
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
  }

  toggleMenu() { this.menuOpen = !this.menuOpen; }
}
