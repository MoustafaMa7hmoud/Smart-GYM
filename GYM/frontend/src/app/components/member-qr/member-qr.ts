import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import QRCode from 'qrcode';
import { UserApiService } from '../../services/api.services';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-member-qr',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar],
  template: `
    <app-navbar></app-navbar>
    <div class="member-qr" style="padding:2rem;max-width:400px;margin:2rem auto;text-align:center">
      <h2>My Gym QR Code</h2>
      <p style="color:#888;margin-bottom:1rem">Show this code at the front desk for check-in.</p>
      @if (qrDataUrl()) {
        <img [src]="qrDataUrl()!" alt="Member QR code" width="256" height="256" />
      } @else if (error()) {
        <p style="color:#e74c3c">{{ error() }}</p>
      } @else {
        <p>Loading…</p>
      }
      <p style="margin-top:1.5rem"><a routerLink="/dashboard">← Back to dashboard</a></p>
    </div>
  `,
})
export class MemberQr implements OnInit {
  private userApi = inject(UserApiService);
  private auth = inject(AuthService);
  qrDataUrl = signal<string | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.userApi.getMe().subscribe({
      next: async (r) => {
        const token = r.data?.qrToken;
        if (!token) {
          this.error.set('QR code not available. Try logging in again.');
          return;
        }
        try {
          this.qrDataUrl.set(await QRCode.toDataURL(token));
        } catch {
          this.error.set('Could not generate QR image.');
        }
      },
      error: (err) => {
        if (err?.status === 401) {
          this.auth.logout();
          return;
        }
        this.error.set('Could not load profile.');
      },
    });
  }
}
