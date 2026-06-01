import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TrainerApiService } from '../../services/api.services';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-trainers', standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './trainers.html', styleUrls: ['./trainers.css']
})
export class Trainers implements OnInit {
  trainerApi = inject(TrainerApiService);
  router = inject(Router);

  trainers: any[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.loadTrainers();
  }

  loadTrainers() {
    this.loading = true; this.error = '';
    this.trainerApi.getAll().subscribe({
      next: (r:any) => {
        let items = Array.isArray(r) ? r : [];
        // Normalize trainer item shape for reliable display
        this.trainers = items.map((t: any) => {
          const user = t.user || {};
          const displayName = (user?.fullName) || t.name || (typeof user === 'string' ? '' : 'Coach');
          const specializations = Array.isArray(t.specializations) ? t.specializations : [];
          const availRaw = t.availability ?? t.schedule ?? t.availabilities ?? [];
          const availability = Array.isArray(availRaw) ? availRaw.map((d: any) => ({
            day: (d.day || d.name || d.weekday || '').toString().toLowerCase(),
            slots: Array.isArray(d.slots) ? d.slots.map((s: any) => ({ startTime: s.startTime || s.from || s.start || '', endTime: s.endTime || s.to || s.end || '' })) : []
          })) : [];
          return {
            ...t,
            displayName,
            specializations,
            availability,
            sessionPrice: t.sessionPrice || t.price || 0,
            currency: t.currency || 'EGP',
            rating: t.rating?.average ?? t.rating ?? 0
          };
        });
        this.loading = false;
      },
      error: (e:any) => { this.error = e?.error?.message || 'Failed to load trainers'; this.loading = false; }
    });
  }

  goToSubscribe(t: any) {
    // Navigate to subscribe page with trainer id as query param
    this.router.navigate(['/subscribe'], { queryParams: { trainer: t._id || t.id } });
  }
}
