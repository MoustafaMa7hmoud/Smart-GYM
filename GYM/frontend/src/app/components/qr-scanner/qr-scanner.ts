import {
  AfterViewInit,
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../navbar/navbar';
import { Html5Qrcode } from 'html5-qrcode';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../services/api.services';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './qr-scanner.html',
})
export class QrScanner implements AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private scanner: Html5Qrcode | null = null;
  private processing = false;

  readonly readerId = 'qr-reader';
  loading = signal(true);
  cameraError = signal<string | null>(null);
  statusMessage = signal<string | null>(null);
  statusType = signal<'success' | 'error' | null>(null);

  ngAfterViewInit(): void {
    this.startScanner();
  }

  ngOnDestroy(): void {
    void this.stopScanner();
  }

  private async startScanner(): Promise<void> {
    this.loading.set(true);
    this.cameraError.set(null);
    this.scanner = new Html5Qrcode(this.readerId);

    try {
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => this.onScan(decodedText),
        () => {}
      );
      this.loading.set(false);
    } catch {
      this.loading.set(false);
      this.cameraError.set(
        'Could not access the camera. Allow camera permission and try again.'
      );
    }
  }

  private onScan(qrToken: string): void {
    const token = qrToken?.trim();
    if (!token || this.processing) return;

    this.processing = true;
    this.clearStatus();

    this.http
      .post<ApiResponse<unknown>>(`${environment.apiUrl}/attendance/qr-check-in`, {
        qrToken: token,
      })
      .subscribe({
        next: (res) => {
          this.statusType.set('success');
          this.statusMessage.set(res.message || 'Check-in successful.');
          this.processing = false;
        },
        error: (err) => {
          this.statusType.set('error');
          this.statusMessage.set(
            err?.error?.message || 'Check-in failed. Please try again.'
          );
          this.processing = false;
        },
      });
  }

  private clearStatus(): void {
    this.statusMessage.set(null);
    this.statusType.set(null);
  }

  private async stopScanner(): Promise<void> {
    if (!this.scanner) return;
    try {
      if (this.scanner.isScanning) {
        await this.scanner.stop();
      }
      this.scanner.clear();
    } catch {
      /* ignore cleanup errors */
    }
    this.scanner = null;
  }
}
