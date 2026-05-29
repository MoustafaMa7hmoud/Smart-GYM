import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  UserApiService, ExerciseApiService, SubscriptionApiService,
  AttendanceApiService, ProgressApiService, WorkoutPlanApiService,
  PaymentApiService
} from '../../services/api.services';
import { FilterExPipe } from '../../filter-muscle.pipe';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-client-dashboard', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, Footer, FilterExPipe],
  templateUrl: './client-dashboard.html', styleUrls: ['./client-dashboard.css']
})
export class ClientDashboard implements OnInit {
  auth     = inject(AuthService);
  userApi  = inject(UserApiService);
  exApi    = inject(ExerciseApiService);
  subApi   = inject(SubscriptionApiService);
  attApi   = inject(AttendanceApiService);
  progApi  = inject(ProgressApiService);
  wpApi    = inject(WorkoutPlanApiService);
  payApi   = inject(PaymentApiService);
  router   = inject(Router);

  activeTab: 'overview'|'workouts'|'exercises'|'progress'|'attendance'|'subscription'|'profile' = 'overview';
  tabs = [
    { id: 'overview',     label: 'Overview',      icon: 'fa-th-large'      },
    { id: 'workouts',     label: 'Workout Plans', icon: 'fa-dumbbell'      },
    { id: 'exercises',    label: 'Exercises',     icon: 'fa-running'       },
    { id: 'progress',     label: 'Progress',      icon: 'fa-chart-line'    },
    { id: 'attendance',   label: 'Attendance',    icon: 'fa-calendar-check'},
    { id: 'subscription', label: 'Subscription',  icon: 'fa-star'          },
    { id: 'profile',      label: 'Profile',       icon: 'fa-user'          },
  ];

  // ── Data ──────────────────────────────────────────────────────────────────
  user: any         = null;
  exercises: any[]  = [];
  workoutPlans: any[]= [];
  subscription: any = null;
  attendance: any[] = [];
  measurements: any[]= [];
  workoutLogs: any[] = [];
  payments: any[]   = [];

  // ── UI state ──────────────────────────────────────────────────────────────
  isCheckedIn  = false;
  checkInTime: Date | null = null;
  dataLoading  = true;
  successMsg   = '';
  errorMsg     = '';

  // Exercise browse
  selectedExercise: any    = null;
  selectedMuscle: string | null = null;
  muscleGroups = [
    { id: 'chest',     label: 'Chest',     icon: '💪' },
    { id: 'back',      label: 'Back',      icon: '🔙' },
    { id: 'shoulders', label: 'Shoulders', icon: '🏋️' },
    { id: 'arms',      label: 'Arms',      icon: '💪' },
    { id: 'legs',      label: 'Legs',      icon: '🦵' },
    { id: 'abs',       label: 'Core & Abs',icon: '⭐' },
  ];

  // Progress tabs
  progressTab: 'body' | 'workout' = 'body';

  // Body measurement form
  showMeasurementForm = false;
  newWeight = 0; newHeight = 0; newBodyFat = 0;
  newChest = 0; newWaist = 0; newHips = 0;

  // Workout progress form
  showWorkoutForm = false;
  selectedExerciseForLog = '';
  workoutSets: { setNumber: number; reps: number; weight: number }[] = [
    { setNumber: 1, reps: 10, weight: 0 }
  ];

  // Profile edit
  editMode  = false;
  editGoal  = '';
  editLevel = '';
  editPhone = '';

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit() {
    if (!this.auth.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.user = this.auth.currentUser;
    this.loadAllData();
  }

  loadAllData() {
    this.dataLoading = true;

    // Profile
    this.userApi.getMe().subscribe({
      next: r => {
        this.user = r.data;
        this.auth.updateCurrentUser(r.data);
        this.editGoal  = r.data.goal  || '';
        this.editLevel = r.data.level || 'beginner';
        this.editPhone = r.data.phone || '';
      },
      error: () => {} // keep cached user
    });

    // Exercises — getAll() already returns any[]
    this.exApi.getAll().subscribe({
      next: arr => { this.exercises = Array.isArray(arr) ? arr : []; },
      error: ()  => { this.exercises = []; }
    });

    // Workout plans — getAll() already returns any[]
    this.wpApi.getAll().subscribe({
      next: arr => { this.workoutPlans = Array.isArray(arr) ? arr : []; },
      error: ()  => { this.workoutPlans = []; }
    });

    // Subscription
    this.userApi.getMySubscription().subscribe({
      next: r  => { this.subscription = r.data ?? null; this.dataLoading = false; },
      error: () => { this.subscription = null; this.dataLoading = false; }
    });

    // Attendance — getMy() returns any[]
    this.attApi.getMy().subscribe({
      next: arr => {
        this.attendance = arr;
        const open = this.attendance.find((a: any) => !a.checkOut);
        if (open) { this.isCheckedIn = true; this.checkInTime = new Date(open.checkIn); }
      },
      error: () => { this.attendance = []; }
    });

    // Body measurements — getBodyMeasurements() returns any[]
    this.progApi.getBodyMeasurements().subscribe({
      next: arr => { this.measurements = arr; },
      error: ()  => { this.measurements = []; }
    });

    // Workout logs
    this.progApi.getWorkoutProgress().subscribe({
      next: arr => { this.workoutLogs = arr; },
      error: ()  => { this.workoutLogs = []; }
    });

    // Payments
    this.payApi.getMy().subscribe({
      next: arr => { this.payments = arr; },
      error: () => { this.payments = []; }
    });
  }

  setTab(t: any) {
    this.activeTab = t;
    this.selectedExercise = null;
    this.selectedMuscle   = null;
  }

  // ── Attendance ─────────────────────────────────────────────────────────────
  doCheckIn() {
    this.attApi.checkIn().subscribe({
      next: r => {
        this.isCheckedIn = true;
        this.checkInTime = new Date(r.data.checkIn);
        this.attendance.unshift(r.data);
        this.toast('Checked in successfully!');
      },
      error: e => this.toastError(e?.error?.message || 'Check-in failed')
    });
  }

  doCheckOut() {
    this.attApi.checkOut().subscribe({
      next: r => {
        this.isCheckedIn = false;
        this.checkInTime = null;
        const idx = this.attendance.findIndex((a: any) => !a.checkOut);
        if (idx > -1) this.attendance[idx] = r.data;
        this.toast('Checked out! Great session 💪');
      },
      error: e => this.toastError(e?.error?.message || 'Check-out failed')
    });
  }

  // ── Body Measurement ───────────────────────────────────────────────────────
  addMeasurement() {
    if (!this.newWeight && !this.newHeight && !this.newChest && !this.newWaist) {
      this.toastError('Enter at least one measurement value');
      return;
    }
    const payload: any = {};
    if (this.newWeight)  payload.weight  = this.newWeight;
    if (this.newHeight)  payload.height  = this.newHeight;
    if (this.newBodyFat) payload.bodyFat = this.newBodyFat;
    if (this.newChest)   payload.chest   = this.newChest;
    if (this.newWaist)   payload.waist   = this.newWaist;
    if (this.newHips)    payload.hips    = this.newHips;

    this.progApi.addBodyMeasurement(payload).subscribe({
      next: r => {
        this.measurements.push(r.data);
        this.showMeasurementForm = false;
        this.newWeight = this.newHeight = this.newBodyFat = 0;
        this.newChest  = this.newWaist  = this.newHips   = 0;
        this.toast('Measurement saved!');
      },
      error: e => this.toastError(e?.error?.message || 'Could not save measurement')
    });
  }

  // ── Workout Progress ───────────────────────────────────────────────────────
  addWorkoutSet() {
    this.workoutSets.push({
      setNumber: this.workoutSets.length + 1,
      reps: 10, weight: 0
    });
  }

  removeWorkoutSet(i: number) {
    if (this.workoutSets.length > 1) {
      this.workoutSets.splice(i, 1);
      this.workoutSets.forEach((s, idx) => s.setNumber = idx + 1);
    }
  }

  logWorkoutProgress() {
    if (!this.selectedExerciseForLog) { this.toastError('Select an exercise'); return; }
    const payload = {
      exercise: this.selectedExerciseForLog,
      sets: this.workoutSets,
    };
    console.log('Workout progress payload', payload);
    this.progApi.addWorkoutProgress(payload).subscribe({
      next: r => {
        this.workoutLogs.unshift(r.data);
        this.showWorkoutForm = false;
        this.selectedExerciseForLog = '';
        this.workoutSets = [{ setNumber: 1, reps: 10, weight: 0 }];
        this.toast('Workout logged!');
      },
      error: e => this.toastError(e?.error?.message || 'Could not log workout')
    });
  }

  // ── Profile ────────────────────────────────────────────────────────────────
  saveProfile() {
    this.userApi.updateMe({ goal: this.editGoal, level: this.editLevel, phone: this.editPhone }).subscribe({
      next: r => {
        this.user = r.data;
        this.auth.updateCurrentUser(r.data);
        this.editMode = false;
        this.toast('Profile updated!');
      },
      error: e => this.toastError(e?.error?.message || 'Update failed')
    });
  }

  // ── Exercises ──────────────────────────────────────────────────────────────
  get filteredExercises() {
    if (!Array.isArray(this.exercises)) return [];
    return this.selectedMuscle
      ? this.exercises.filter((e: any) => e.muscle === this.selectedMuscle)
      : this.exercises;
  }
  selectMuscle(id: string) { this.selectedMuscle = id; this.selectedExercise = null; }
  openExercise(ex: any)    { this.selectedExercise = ex; }

  // ── Helpers ────────────────────────────────────────────────────────────────
  toast(msg: string)      { this.successMsg = msg; setTimeout(() => this.successMsg = '', 3500); }
  toastError(msg: string) { this.errorMsg   = msg; setTimeout(() => this.errorMsg   = '', 4500); }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDuration(min?: number): string {
    if (!min) return '—';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }

  daysUntilExpiry(): number {
    if (!this.subscription?.endDate) return 0;
    return Math.max(0, Math.ceil(
      (new Date(this.subscription.endDate).getTime() - Date.now()) / 86400000
    ));
  }

  get latestMeasurement(): any {
    return this.measurements.length ? this.measurements[this.measurements.length - 1] : null;
  }

  get weightTrend(): number {
    if (this.measurements.length < 2) return 0;
    return +(
      this.measurements[this.measurements.length - 1].weight - this.measurements[0].weight
    ).toFixed(1);
  }

  getLevelColor(l: string): string {
    return l === 'beginner' ? '#34d399' : l === 'intermediate' ? '#DAFF6E' : '#fb923c';
  }

  getGoalLabel(g: string): string {
    const map: Record<string, string> = {
      muscle_gain: 'Muscle Gain', muscleGain: 'Muscle Gain',
      weight_loss: 'Weight Loss', weightLoss: 'Weight Loss',
      fitness: 'General Fitness', generalFitness: 'General Fitness',
      endurance: 'Endurance',
    };
    return map[g] || g || '—';
  }

  getInitials(name: string): string {
    const p = (name || '').trim().split(/\s+/);
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
  }

  getExerciseImageUrl(ex: any): string {
    return ex?.image?.url || ex?.image || ex?.imageUrl || '';
  }
}
