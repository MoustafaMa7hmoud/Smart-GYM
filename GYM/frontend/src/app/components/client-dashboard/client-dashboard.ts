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
  attendanceStats: any = null;
  progressStats: any   = null;
  favoriteIds = new Set<string>();

  // ── UI state ──────────────────────────────────────────────────────────────
  isCheckedIn  = false;
  checkInTime: Date | null = null;
  dataLoading  = true;
  subLoading   = true;
  plansLoading = true;
  successMsg   = '';
  errorMsg     = '';
  private pendingLoads = 0;

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

  // Workout plans
  selectedPlan: any = null;
  planDetailLoading = false;

  // Progress tabs
  progressTab: 'body' | 'workout' = 'body';

  // Body measurement form
  showMeasurementForm = false;
  newWeight = 0; newBodyFat = 0;
  newChest = 0; newWaist = 0;

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
  showPasswordForm = false;
  currentPassword = '';
  newPassword = '';

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit() {
    if (!this.auth.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.user = this.auth.currentUser;
    this.loadAllData();
  }

  loadAllData() {
    this.dataLoading = true;
    this.subLoading = true;
    this.plansLoading = true;
    this.pendingLoads = 9;

    this.userApi.getMe().subscribe({
      next: r => {
        this.user = r.data;
        this.auth.updateCurrentUser(r.data);
        this.editGoal  = r.data.goal  || '';
        this.editLevel = r.data.level || 'beginner';
        this.editPhone = r.data.phone || '';
        this.syncFavorites(r.data.favoriteExercises);
      },
      error: e => { this.toastError(e?.error?.message || 'Could not load profile'); this.finishLoad(); },
      complete: () => this.finishLoad()
    });

    this.exApi.getAll().subscribe({
      next: arr => { this.exercises = Array.isArray(arr) ? arr : []; },
      error: e => { this.exercises = []; this.toastError(e?.error?.message || 'Could not load exercises'); this.finishLoad(); },
      complete: () => this.finishLoad()
    });

    this.wpApi.getAll().subscribe({
      next: arr => { this.workoutPlans = Array.isArray(arr) ? arr : []; },
      error: e => {
        this.workoutPlans = [];
        this.plansLoading = false;
        this.toastError(e?.error?.message || 'Could not load workout plans');
        this.finishLoad();
      },
      complete: () => { this.plansLoading = false; this.finishLoad(); }
    });

    this.subApi.getMy().subscribe({
      next: r => { this.subscription = r.data ?? null; },
      error: () => { this.subscription = null; this.subLoading = false; this.finishLoad(); },
      complete: () => { this.subLoading = false; this.finishLoad(); }
    });

    this.attApi.getMy().subscribe({
      next: arr => {
        this.attendance = arr;
        const open = this.attendance.find((a: any) => !a.checkOut);
        if (open) { this.isCheckedIn = true; this.checkInTime = new Date(open.checkIn); }
      },
      error: e => { this.attendance = []; this.toastError(e?.error?.message || 'Could not load attendance'); this.finishLoad(); },
      complete: () => this.finishLoad()
    });

    this.attApi.getStats().subscribe({
      next: r => { this.attendanceStats = r.data; },
      error: () => { this.attendanceStats = null; this.finishLoad(); },
      complete: () => this.finishLoad()
    });

    this.progApi.getBodyMeasurements().subscribe({
      next: arr => { this.measurements = arr; },
      error: e => { this.measurements = []; this.toastError(e?.error?.message || 'Could not load measurements'); this.finishLoad(); },
      complete: () => this.finishLoad()
    });

    this.progApi.getWorkoutProgress().subscribe({
      next: arr => { this.workoutLogs = arr; },
      error: e => { this.workoutLogs = []; this.toastError(e?.error?.message || 'Could not load workout logs'); this.finishLoad(); },
      complete: () => this.finishLoad()
    });

    this.progApi.getStats().subscribe({
      next: r => { this.progressStats = r.data; },
      error: () => { this.progressStats = null; this.finishLoad(); },
      complete: () => this.finishLoad()
    });

    this.payApi.getMy().subscribe({
      next: arr => { this.payments = arr; },
      error: e => { this.payments = []; this.toastError(e?.error?.message || 'Could not load payment history'); this.finishLoad(); },
      complete: () => this.finishLoad()
    });
  }

  private finishLoad() {
    this.pendingLoads--;
    if (this.pendingLoads <= 0) this.dataLoading = false;
  }

  setTab(t: any) {
    this.activeTab = t;
    this.selectedExercise = null;
    this.selectedMuscle   = null;
    this.selectedPlan     = null;
  }

  // ── Attendance ─────────────────────────────────────────────────────────────
  hasActiveSubscription(): boolean {
    return this.subscription?.status === 'active';
  }

  doCheckIn() {
    if (!this.hasActiveSubscription()) {
      this.toastError('An active subscription is required to check in.');
      return;
    }
    this.attApi.checkIn().subscribe({
      next: r => {
        this.isCheckedIn = true;
        this.checkInTime = new Date(r.data.checkIn);
        this.attendance.unshift(r.data);
        this.refreshAttendanceStats();
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
        this.refreshAttendanceStats();
        this.toast('Checked out! Great session 💪');
      },
      error: e => this.toastError(e?.error?.message || 'Check-out failed')
    });
  }

  private refreshAttendanceStats() {
    this.attApi.getStats().subscribe({
      next: r => { this.attendanceStats = r.data; },
      error: () => {}
    });
  }

  // ── Workout Plans ──────────────────────────────────────────────────────────
  generatePlan() {
    const goal  = this.user?.goal || this.editGoal || 'fitness';
    const level = this.user?.level || this.editLevel || 'beginner';
    this.wpApi.generate({ goal, level }).subscribe({
      next: r => {
        this.workoutPlans.unshift(r.data);
        this.toast('Workout plan generated!');
      },
      error: e => this.toastError(e?.error?.message || 'Could not generate plan')
    });
  }

  openPlan(plan: any) {
    this.planDetailLoading = true;
    this.selectedPlan = null;
    this.wpApi.getById(plan._id).subscribe({
      next: r => { this.selectedPlan = r.data; this.planDetailLoading = false; },
      error: e => {
        this.selectedPlan = plan;
        this.planDetailLoading = false;
        this.toastError(e?.error?.message || 'Could not load plan details');
      }
    });
  }

  // ── Subscription ───────────────────────────────────────────────────────────
  cancelSubscription() {
    if (!this.subscription?._id) return;
    this.subApi.cancel(this.subscription._id).subscribe({
      next: () => {
        this.subscription = null;
        this.toast('Subscription cancelled.');
      },
      error: e => this.toastError(e?.error?.message || 'Could not cancel subscription')
    });
  }

  // ── Body Measurement ───────────────────────────────────────────────────────
  addMeasurement() {
    if (!this.newWeight && !this.newBodyFat && !this.newChest && !this.newWaist) {
      this.toastError('Enter at least one measurement value');
      return;
    }
    const payload: any = {};
    if (this.newWeight)  payload.weight  = this.newWeight;
    if (this.newBodyFat) payload.bodyFat = this.newBodyFat;
    if (this.newChest)   payload.chest   = this.newChest;
    if (this.newWaist)   payload.waist   = this.newWaist;

    this.progApi.addBodyMeasurement(payload).subscribe({
      next: r => {
        this.measurements.unshift(r.data);
        this.showMeasurementForm = false;
        this.newWeight = this.newBodyFat = 0;
        this.newChest  = this.newWaist   = 0;
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
    const exerciseId = this.selectedExerciseForLog;
    this.progApi.addWorkoutProgress({
      exercise: exerciseId,
      sets: this.workoutSets,
    }).subscribe({
      next: r => {
        this.workoutLogs.unshift(this.enrichWorkoutLog(r.data, exerciseId));
        this.showWorkoutForm = false;
        this.selectedExerciseForLog = '';
        this.workoutSets = [{ setNumber: 1, reps: 10, weight: 0 }];
        this.progApi.getStats().subscribe({
          next: res => { this.progressStats = res.data; },
          error: () => {}
        });
        this.toast('Workout logged!');
      },
      error: e => this.toastError(e?.error?.message || 'Could not log workout')
    });
  }

  deleteWorkoutLog(log: any) {
    if (!log?._id) return;
    this.progApi.deleteWorkoutLog(log._id).subscribe({
      next: () => {
        this.workoutLogs = this.workoutLogs.filter(l => l._id !== log._id);
        this.progApi.getStats().subscribe({
          next: res => { this.progressStats = res.data; },
          error: () => {}
        });
        this.toast('Workout log deleted.');
      },
      error: e => this.toastError(e?.error?.message || 'Could not delete log')
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

  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.userApi.uploadAvatar(file).subscribe({
      next: r => {
        this.user = r.data;
        this.auth.updateCurrentUser(r.data);
        this.toast('Avatar updated!');
      },
      error: e => this.toastError(e?.error?.message || 'Avatar upload failed')
    });
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword) {
      this.toastError('Enter current and new password');
      return;
    }
    this.userApi.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        this.currentPassword = this.newPassword = '';
        this.showPasswordForm = false;
        this.toast('Password changed!');
      },
      error: e => this.toastError(e?.error?.message || 'Password change failed')
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

  openExercise(ex: any) {
    this.selectedExercise = ex;
    this.exApi.getById(ex._id).subscribe({
      next: r => { this.selectedExercise = r.data; },
      error: e => this.toastError(e?.error?.message || 'Could not load exercise details')
    });
  }

  isFavorite(exerciseId: string): boolean {
    return this.favoriteIds.has(exerciseId);
  }

  toggleFavorite(ex: any) {
    const id = ex._id;
    const adding = !this.isFavorite(id);
    const req = adding
      ? this.userApi.addFavourite(id)
      : this.userApi.removeFavourite(id);
    req.subscribe({
      next: r => {
        this.user = r.data;
        this.syncFavorites(r.data.favoriteExercises);
        this.toast(adding ? 'Added to favorites' : 'Removed from favorites');
      },
      error: e => this.toastError(e?.error?.message || 'Could not update favorites')
    });
  }

  private syncFavorites(favorites: any[] | undefined) {
    this.favoriteIds = new Set(
      (favorites || []).map((e: any) => (typeof e === 'string' ? e : e._id)).filter(Boolean)
    );
  }

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
    return this.measurements.length ? this.measurements[0] : null;
  }

  get weightTrend(): number {
    if (this.measurements.length < 2) return 0;
    const newest = this.measurements[0]?.weight;
    const oldest = this.measurements[this.measurements.length - 1]?.weight;
    if (newest == null || oldest == null) return 0;
    return +(newest - oldest).toFixed(1);
  }

  getLevelColor(l: string): string {
    return l === 'beginner' ? '#34d399' : l === 'intermediate' ? '#DAFF6E' : '#fb923c';
  }

  getGoalLabel(g: string): string {
    const map: Record<string, string> = {
      muscle_gain: 'Muscle Gain', muscleGain: 'Muscle Gain',
      weight_loss: 'Weight Loss', weightLoss: 'Weight Loss',
      fitness: 'General Fitness', generalFitness: 'General Fitness',
    };
    return map[g] || g || '—';
  }

  getRoleLabel(): string {
    const map: Record<string, string> = {
      user: 'Member', trainer: 'Trainer', admin: 'Admin', superAdmin: 'Admin',
    };
    return map[this.user?.role] || this.user?.role || 'Member';
  }

  getInitials(name: string): string {
    const p = (name || '').trim().split(/\s+/);
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
  }

  getExerciseImageUrl(ex: any): string {
    return ex?.image?.url || ex?.image || ex?.imageUrl || '';
  }

  getProfileImageUrl(): string {
    return this.user?.profileImage?.url || this.user?.profileImage || '';
  }

  getPaymentAmount(p: any): number {
    return p?.amount ?? p?.amountEGP ?? 0;
  }

  getPaymentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      completed: 'Success', pending: 'Pending', failed: 'Failed',
      refunded: 'Refunded', cancelled: 'Cancelled', success: 'Success',
    };
    return map[status] || status || '—';
  }

  getPaymentStatusClass(status: string): string {
    return status === 'completed' ? 'success' : (status || '');
  }

  getLogExerciseName(log: any): string {
    if (log.exercise?.name) return log.exercise.name;
    const id = typeof log.exercise === 'string' ? log.exercise : log.exercise?._id;
    return this.exercises.find(e => e._id === id)?.name || '—';
  }

  private enrichWorkoutLog(log: any, exerciseId: string): any {
    if (log?.exercise?.name) return log;
    const ex = this.exercises.find(e => e._id === exerciseId);
    return ex ? { ...log, exercise: { _id: ex._id, name: ex.name } } : log;
  }
}
