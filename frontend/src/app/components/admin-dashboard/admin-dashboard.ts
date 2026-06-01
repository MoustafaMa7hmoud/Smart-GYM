import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import {
  AdminApiService, MachineApiService, TrainerApiService, MachineCreatePayload,
} from '../../services/api.services';
import { extractData } from '../../utils/api-response.util';
import {
  DEFAULT_TRAINER_BIO, formatSpecialization, mapTrainerView,
  TRAINER_SPECIALIZATIONS,
} from '../../utils/trainer.util';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

const MACHINE_CATEGORIES = ['cardio', 'strength', 'freeWeights', 'functional', 'stretching', 'recovery'] as const;
const MACHINE_MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'calves', 'fullBody'] as const;

@Component({
  selector: 'app-admin-dashboard', standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, Navbar, Footer],
  templateUrl: './admin-dashboard.html', styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  private fb = inject(FormBuilder);

  auth       = inject(AuthService);
  adminApi   = inject(AdminApiService);
  machineApi = inject(MachineApiService);
  trainerApi = inject(TrainerApiService);

  readonly machineCategories = MACHINE_CATEGORIES;
  readonly machineMuscleHint = MACHINE_MUSCLES.join(', ');
  readonly trainerSpecOptions = TRAINER_SPECIALIZATIONS;
  formatSpec = formatSpecialization;

  activeTab: 'overview'|'users'|'trainers'|'machines'|'subscriptions'|'attendance' = 'overview';
  tabs = [
    { id: 'overview',      label: 'Overview',      icon: 'fa-th-large'      },
    { id: 'users',         label: 'Members',        icon: 'fa-users'         },
    { id: 'trainers',      label: 'Trainers',       icon: 'fa-user-tie'      },
    { id: 'machines',      label: 'Machines',       icon: 'fa-cog'           },
    { id: 'subscriptions', label: 'Subscriptions',  icon: 'fa-star'          },
    { id: 'attendance',    label: 'Attendance',     icon: 'fa-calendar-check'},
  ];

  // Data
  stats: any         = null;
  adminStats: any     = { totalUsers: 0, totalTrainers: 0, totalActiveSubscriptions: 0, todayAttendanceCount: 0 };
  users: any[]       = [];
  trainers: any[]    = [];
  machines: any[]    = [];
  subscriptions: any[]= [];
  attendance: any[]  = [];
  totalRevenue = 0;
  userTotal = 0;
  trainerTotal = 0;

  // UI state
  userSearch   = '';
  selectedUser: any = null;
  editUserMode = false;
  editUserData: any = {};
  successMsg   = '';
  errorMsg     = '';
  loadingUsers = false;
  loadingMachines = false;
  loadingAttendance = false;
  loadingOverview = false;
  savingMachine = false;

  // Trainers UI
  trainerSearch = '';
  selectedTrainer: any = null;
  loadingTrainerDetail = false;
  assignUserId = '';
  showCreateTrainer = false;
  createTrainerUserId = '';
  createTrainerData = {
    bio: DEFAULT_TRAINER_BIO,
    experience: 1,
    sessionPrice: 300,
    specializations: ['bodyBuilding'] as string[],
  };
  editTrainerMode = false;
  editTrainerData = {
    bio: '',
    experience: 1,
    sessionPrice: 300,
    specializations: [] as string[],
  };

  // Add machine form
  showAddMachine = false;
  machineForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    category: ['strength', Validators.required],
    muscleGroups: ['fullBody', Validators.required],
    status: ['active', Validators.required],
    brand: [''],
    location: [''],
  });

  ngOnInit() {
    this.loadOverview();
  }

  setTab(t: any) {
    this.activeTab = t;
    this.selectedUser = null;
    this.selectedTrainer = null;
    this.editUserMode = false;
    if (t === 'overview') {
      this.loadOverview();
      return;
    }
    if (t === 'users') this.loadUsers();
    if (t === 'trainers') {
      this.loadTrainers();
      if (!this.users.length) this.loadUsers();
    }
    if (t === 'machines') this.loadMachines();
    if (t === 'subscriptions') this.loadSubscriptions();
    if (t === 'attendance') this.loadAttendance();
  }

  /** Load all datasets used by Overview (stats + today's check-ins + equipment). */
  loadOverview() {
    this.loadingOverview = true;
    this.loadingAttendance = true;
    this.loadingMachines = true;

    forkJoin({
      users: this.adminApi.getAllUsersPaged().pipe(catchError(() => of({ items: [], total: 0 }))),
      trainers: this.trainerApi.getAllPaged().pipe(catchError(() => of({ items: [], total: 0 }))),
      machines: this.machineApi.getAll({ sort: '-createdAt' }).pipe(catchError(() => of([]))),
      subscriptions: this.adminApi.getAllSubscriptionsPaged().pipe(catchError(() => of({ items: [], total: 0 }))),
      attendance: this.adminApi.getAllAttendance().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ users, trainers, machines, subscriptions, attendance }) => {
        this.users = users.items;
        this.userTotal = users.total;
        this.trainers = trainers.items.map(t => mapTrainerView(t));
        this.trainerTotal = trainers.total;
        this.machines = Array.isArray(machines) ? machines.map(m => this.mapMachine(m)) : [];
        this.subscriptions = subscriptions.items;
        this.attendance = Array.isArray(attendance) ? attendance.map(a => this.mapAttendance(a)) : [];
        this.computeRevenue();
        this.refreshAdminStats();
        this.loadingOverview = false;
        this.loadingAttendance = false;
        this.loadingMachines = false;
      },
      error: e => {
        this.loadingOverview = false;
        this.loadingAttendance = false;
        this.loadingMachines = false;
        this.toastError(this.apiError(e, 'Failed to load dashboard overview'));
      },
    });
  }

  // ── Loaders ────────────────────────────────────────────────────────────────
  private refreshAdminStats() {
    this.adminStats = {
      totalUsers: this.userTotal || this.users.length,
      totalTrainers: this.trainerTotal || this.trainers.length,
      totalActiveSubscriptions: this.subscriptions.filter((s: any) => s.status === 'active').length,
      todayAttendanceCount: this.countTodayAttendance(),
      equipmentCount: this.machines.length,
    };
    this.stats = this.adminStats;
  }

  get overviewMachines() {
    return this.machines.slice(0, 8);
  }

  private isToday(dateValue?: string | Date): boolean {
    if (!dateValue) return false;
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return d.getDate() === today.getDate()
      && d.getMonth() === today.getMonth()
      && d.getFullYear() === today.getFullYear();
  }

  get todayAttendance(): any[] {
    return this.attendance.filter((a: any) => this.isToday(a.checkIn));
  }

  private countTodayAttendance(): number {
    return this.todayAttendance.length;
  }

  private apiError(e: any, fallback: string): string {
    const details = e?.error?.errors;
    if (Array.isArray(details) && details.length) {
      return details.map((d: any) => d.message || d.field).join('; ');
    }
    return e?.error?.message || fallback;
  }

  loadUsers() {
    this.adminApi.getAllUsers().subscribe({
      next: users => { this.users = Array.isArray(users) ? users : []; this.refreshAdminStats(); },
      error: e => { this.users = []; this.refreshAdminStats(); this.toastError(this.apiError(e, 'Failed to load members')); }
    });
  }

  loadTrainers() {
    this.trainerApi.getAll().subscribe({
      next: trainers => {
        const list = Array.isArray(trainers) ? trainers : [];
        this.trainers = list.map(t => mapTrainerView(t));
        this.refreshAdminStats();
      },
      error: e => { this.trainers = []; this.refreshAdminStats(); this.toastError(this.apiError(e, 'Failed to load trainers')); }
    });
  }

  loadMachines(showSpinner = true) {
    if (showSpinner) this.loadingMachines = true;
    this.machineApi.getAll({ sort: '-createdAt' }).subscribe({
      next: arr => {
        const loaded = Array.isArray(arr) ? arr.map(m => this.mapMachine(m)) : [];
        if (loaded.length) {
          this.machines = loaded;
        }
        this.loadingMachines = false;
        this.refreshAdminStats();
      },
      error: e => {
        this.loadingMachines = false;
        this.refreshAdminStats();
        this.toastError(this.apiError(e, 'Failed to load machines'));
      }
    });
  }

  private upsertMachineInList(machine: any) {
    if (!machine?._id) return;
    const mapped = this.mapMachine(machine);
    const id = String(mapped._id);
    this.machines = [mapped, ...this.machines.filter(m => String(m._id) !== id)];
    this.refreshAdminStats();
  }

  loadSubscriptions() {
    this.adminApi.getAllSubscriptions().subscribe({
      next: subs => {
        this.subscriptions = Array.isArray(subs) ? subs : [];
        this.computeRevenue();
        this.refreshAdminStats();
      },
      error: e => {
        this.subscriptions = [];
        this.computeRevenue();
        this.refreshAdminStats();
        this.toastError(this.apiError(e, 'Failed to load subscriptions'));
      }
    });
  }

  loadAttendance() {
    this.loadingAttendance = true;
    this.adminApi.getAllAttendance().subscribe({
      next: arr => {
        this.attendance = Array.isArray(arr) ? arr.map(a => this.mapAttendance(a)) : [];
        this.loadingAttendance = false;
        this.refreshAdminStats();
      },
      error: e => {
        this.attendance = [];
        this.loadingAttendance = false;
        this.refreshAdminStats();
        this.toastError(this.apiError(e, 'Failed to load attendance'));
      }
    });
  }

  private mapMachine(m: any) {
    const id = m._id ?? m.id;
    return {
      ...m,
      _id: id,
      status: m.status || 'active',
      category: m.category || '—',
      muscleGroupsLabel: Array.isArray(m.muscleGroups) ? m.muscleGroups.join(', ') : '',
    };
  }

  private mapAttendance(a: any) {
    let duration = a.duration;
    if (duration == null && a.checkIn && a.checkOut) {
      duration = Math.round(
        (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 60000
      );
    }
    return { ...a, duration };
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  get filteredUsers() {
    const q = this.userSearch.toLowerCase();
    if (!q) return this.users;
    return this.users.filter((u: any) =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email    || '').toLowerCase().includes(q)
    );
  }

  openUser(u: any) {
    this.selectedUser = u;
    this.editUserData = { fullName: u.fullName, email: u.email, phone: u.phone, role: u.role };
    this.editUserMode = false;
  }

  saveUser() {
    if (!this.selectedUser) return;
    this.editUserMode = false;
    this.toastError('User profile editing is not available via the admin API. Use activate/deactivate instead.');
  }

  deactivateUser(id: string) {
    if (!confirm('Deactivate this user?')) return;
    this.adminApi.deactivateUser(id).subscribe({
      next: () => {
        const u = this.users.find((u: any) => u._id === id);
        if (u) u.isActive = false;
        this.selectedUser = null;
        this.toast('User deactivated.');
      },
      error: e => this.toastError(e?.error?.message || 'Failed to deactivate')
    });
  }

  activateUser(id: string) {
    this.adminApi.activateUser(id).subscribe({
      next: () => {
        const u = this.users.find((u: any) => u._id === id);
        if (u) u.isActive = true;
        this.toast('User activated.');
      },
      error: e => this.toastError(e?.error?.message || 'Failed to activate')
    });
  }

  // ── Trainers ───────────────────────────────────────────────────────────────
  get filteredTrainers() {
    const q = this.trainerSearch.toLowerCase().trim();
    if (!q) return this.trainers;
    return this.trainers.filter((t: any) =>
      (t.fullName || '').toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.specializations || []).some((s: string) => s.toLowerCase().includes(q))
    );
  }

  get memberUsers() {
    return this.users.filter((u: any) => u.role === 'user' && u.isActive !== false);
  }

  get trainersWithoutProfile() {
    const linked = new Set(
      this.trainers.map((t: any) => String(t.userId || t.user?._id || t.user))
    );
    return this.users.filter(
      (u: any) => u.role !== 'admin' && u.role !== 'superAdmin' && !linked.has(String(u._id))
    );
  }

  openTrainer(t: any) {
    this.selectedTrainer = mapTrainerView(t);
    this.assignUserId = '';
    this.editTrainerMode = false;
    this.loadTrainerDetail(t._id);
  }

  closeTrainer() {
    this.selectedTrainer = null;
    this.assignUserId = '';
    this.editTrainerMode = false;
  }

  startEditTrainer() {
    if (!this.selectedTrainer) return;
    this.editTrainerMode = true;
    this.editTrainerData = {
      bio: this.selectedTrainer.bio || '',
      experience: this.selectedTrainer.experience || 0,
      sessionPrice: this.selectedTrainer.sessionPrice || 0,
      specializations: [...(this.selectedTrainer.specializations || [])],
    };
  }

  toggleEditSpec(value: string) {
    const specs = this.editTrainerData.specializations;
    const i = specs.indexOf(value);
    if (i >= 0) {
      if (specs.length > 1) specs.splice(i, 1);
    } else {
      specs.push(value);
    }
  }

  saveTrainer() {
    if (!this.selectedTrainer) return;
    if (this.editTrainerData.bio.trim().length < 50) {
      this.toastError('Bio must be at least 50 characters.');
      return;
    }
    this.trainerApi.update(this.selectedTrainer._id, this.editTrainerData).subscribe({
      next: res => {
        const raw = extractData(res) ?? res?.data;
        const mapped = mapTrainerView(raw);
        this.selectedTrainer = mapped;
        this.patchTrainerInList(mapped._id, mapped);
        this.editTrainerMode = false;
        this.toast('Trainer profile updated successfully.');
      },
      error: e => this.toastError(this.apiError(e, 'Failed to update trainer profile')),
    });
  }

  get todayCheckInsCount(): number {
    return this.attendance.filter((a: any) => this.isToday(a.checkIn)).length;
  }

  get todayCheckOutsCount(): number {
    return this.attendance.filter((a: any) => a.checkOut && this.isToday(a.checkOut)).length;
  }

  get presentMembers(): any[] {
    return this.attendance.filter((a: any) => a.checkIn && !a.checkOut);
  }

  get recentAttendanceActivity(): any[] {
    return this.attendance.slice(0, 5);
  }

  loadTrainerDetail(id: string) {
    this.loadingTrainerDetail = true;
    this.trainerApi.getById(id).subscribe({
      next: res => {
        const raw = extractData(res) ?? res?.data;
        this.selectedTrainer = mapTrainerView(raw);
        this.loadingTrainerDetail = false;
        const idx = this.trainers.findIndex((t: any) => String(t._id) === String(id));
        if (idx >= 0) this.trainers[idx] = { ...this.trainers[idx], ...this.selectedTrainer };
      },
      error: e => {
        this.loadingTrainerDetail = false;
        this.toastError(this.apiError(e, 'Failed to load trainer details'));
      },
    });
  }

  private patchTrainerInList(id: string, patch: Partial<any>) {
    const i = this.trainers.findIndex((t: any) => String(t._id) === String(id));
    if (i >= 0) this.trainers[i] = { ...this.trainers[i], ...patch };
    if (this.selectedTrainer && String(this.selectedTrainer._id) === String(id)) {
      this.selectedTrainer = { ...this.selectedTrainer, ...patch };
    }
  }

  approveTrainer(id: string) {
    this.trainerApi.approve(id).subscribe({
      next: () => {
        this.patchTrainerInList(id, { isApproved: true });
        this.toast('Trainer approved!');
      },
      error: e => this.toastError(this.apiError(e, 'Approval failed')),
    });
  }

  rejectTrainer(id: string) {
    if (!confirm('Revoke approval for this trainer?')) return;
    this.trainerApi.reject(id).subscribe({
      next: () => {
        this.patchTrainerInList(id, { isApproved: false });
        this.toast('Trainer approval revoked.');
      },
      error: e => this.toastError(this.apiError(e, 'Failed to revoke approval')),
    });
  }

  toggleTrainerAvailable(t: any) {
    const next = !t.isAvailable;
    this.trainerApi.setAvailability(t._id, next).subscribe({
      next: () => {
        this.patchTrainerInList(t._id, { isAvailable: next });
        this.toast(next ? 'Trainer marked available.' : 'Trainer marked unavailable.');
      },
      error: e => this.toastError(this.apiError(e, 'Failed to update availability')),
    });
  }

  deleteTrainer(id: string) {
    if (!confirm('Delete this trainer profile permanently?')) return;
    this.trainerApi.delete(id).subscribe({
      next: () => {
        this.trainers = this.trainers.filter((t: any) => String(t._id) !== String(id));
        if (this.selectedTrainer?._id === id) this.closeTrainer();
        this.refreshAdminStats();
        this.toast('Trainer deleted.');
      },
      error: e => this.toastError(this.apiError(e, 'Failed to delete trainer')),
    });
  }

  assignMemberToTrainer() {
    const trainerId = this.selectedTrainer?._id;
    const userId = this.assignUserId;
    if (!trainerId || !userId) return;
    this.trainerApi.assign(trainerId, userId).subscribe({
      next: res => {
        const raw = extractData(res) ?? res?.data;
        this.selectedTrainer = mapTrainerView(raw);
        this.assignUserId = '';
        this.loadTrainerDetail(trainerId);
        this.toast('Member assigned to trainer.');
      },
      error: e => this.toastError(this.apiError(e, 'Failed to assign member')),
    });
  }

  unassignMember(userId: string) {
    const trainerId = this.selectedTrainer?._id;
    if (!trainerId) return;
    this.trainerApi.unassign(trainerId, userId).subscribe({
      next: () => {
        this.loadTrainerDetail(trainerId);
        this.toast('Member unassigned.');
      },
      error: e => this.toastError(this.apiError(e, 'Failed to unassign member')),
    });
  }

  toggleCreateTrainerForm() {
    this.showCreateTrainer = !this.showCreateTrainer;
    if (this.showCreateTrainer) {
      this.createTrainerUserId = this.trainersWithoutProfile[0]?._id || '';
      this.createTrainerData = {
        bio: DEFAULT_TRAINER_BIO,
        experience: 1,
        sessionPrice: 300,
        specializations: ['bodyBuilding'],
      };
    }
  }

  toggleCreateSpec(value: string) {
    const specs = this.createTrainerData.specializations;
    const i = specs.indexOf(value);
    if (i >= 0) {
      if (specs.length > 1) specs.splice(i, 1);
    } else {
      specs.push(value);
    }
  }

  createTrainerProfileForUser() {
    const userId = this.createTrainerUserId;
    if (!userId) {
      this.toastError('Select a trainer user account.');
      return;
    }
    if (this.createTrainerData.bio.trim().length < 50) {
      this.toastError('Bio must be at least 50 characters.');
      return;
    }
    this.trainerApi.createForUser(userId, {
      ...this.createTrainerData,
      isApproved: true,
    }).subscribe({
      next: res => {
        const raw = extractData(res) ?? res?.data;
        const mapped = mapTrainerView(raw);
        this.trainers = [mapped, ...this.trainers.filter(t => String(t._id) !== String(mapped._id))];
        this.showCreateTrainer = false;
        this.refreshAdminStats();
        this.toast('Trainer profile created.');
      },
      error: e => this.toastError(this.apiError(e, 'Failed to create trainer profile')),
    });
  }

  // ── Machines ───────────────────────────────────────────────────────────────
  toggleAddMachineForm() {
    this.showAddMachine = !this.showAddMachine;
    if (this.showAddMachine) this.resetMachineForm();
  }

  resetMachineForm() {
    this.machineForm.reset({
      name: '',
      category: 'strength',
      muscleGroups: 'fullBody',
      status: 'active',
      brand: '',
      location: '',
    });
    this.machineForm.markAsPristine();
    this.machineForm.markAsUntouched();
  }

  private parseMuscleGroupsInput(raw: string | string[] | null | undefined): string[] {
    if (Array.isArray(raw)) {
      return raw
        .map(s => {
          const x = String(s).trim().toLowerCase();
          return x === 'fullbody' ? 'fullBody' : x;
        })
        .filter(s => (MACHINE_MUSCLES as readonly string[]).includes(s));
    }
    const text = String(raw ?? '').trim();
    if (!text) return ['fullBody'];
    return text
      .split(',')
      .map(s => {
        const x = s.trim().toLowerCase();
        return x === 'fullbody' ? 'fullBody' : x;
      })
      .filter(s => (MACHINE_MUSCLES as readonly string[]).includes(s));
  }

  /** Build API payload with required fields always set (never undefined). */
  buildMachineCreatePayload(): MachineCreatePayload | null {
    const v = this.machineForm.getRawValue();
    const name = v.name.trim();
    const category = (v.category || 'strength').trim();
    const muscleGroups = this.parseMuscleGroupsInput(v.muscleGroups);

    if (!name || name.length < 3) {
      this.toastError('Machine name is required (min 3 characters).');
      return null;
    }
    if (!(MACHINE_CATEGORIES as readonly string[]).includes(category)) {
      this.toastError('Please select a valid category.');
      return null;
    }
    if (!muscleGroups.length) {
      this.toastError(`Enter at least one muscle group: ${this.machineMuscleHint}`);
      return null;
    }

    const notes = [v.brand?.trim(), v.location?.trim()].filter(Boolean).join(' · ');
    return {
      name,
      category,
      muscleGroups,
      status: v.status || 'active',
      ...(v.brand?.trim() ? { brand: v.brand.trim() } : {}),
      ...(notes ? { notes } : {}),
    };
  }

  addMachine() {
    this.machineForm.markAllAsTouched();
    if (this.machineForm.invalid) {
      this.toastError('Please fill in all required machine fields.');
      return;
    }

    const payload = this.buildMachineCreatePayload();
    if (!payload) return;

    this.savingMachine = true;
    this.machineApi.create(payload).subscribe({
      next: (res) => {
        this.savingMachine = false;
        if (!res?.success) {
          this.toastError(res?.message || 'Failed to add machine');
          return;
        }
        const created = extractData<any>(res);
        if (created) {
          this.upsertMachineInList(created);
        }
        this.showAddMachine = false;
        this.resetMachineForm();
        this.toast(res?.message || 'Machine added!');
        this.loadMachines(false);
      },
      error: e => {
        this.savingMachine = false;
        this.toastError(this.apiError(e, 'Failed to add machine'));
      }
    });
  }

  deleteMachine(id: string) {
    if (!confirm('Delete this machine?')) return;
    this.machineApi.delete(id).subscribe({
      next: () => {
        this.machines = this.machines.filter((m: any) => m._id !== id);
        this.refreshAdminStats();
        this.toast('Machine removed.');
      },
      error: e => this.toastError(this.apiError(e, 'Failed to delete'))
    });
  }

  toggleMachineStatus(m: any) {
    const nextStatus = m.status === 'active' ? 'maintenance' : 'active';
    this.machineApi.update(m._id, { status: nextStatus }).subscribe({
      next: (res) => {
        const updated = extractData<any>(res);
        m.status = updated?.status ?? nextStatus;
        this.refreshAdminStats();
        this.toast('Status updated.');
      },
      error: e => this.toastError(this.apiError(e, 'Failed to update status'))
    });
  }

  deleteUser(id: string) {
    this.deactivateUser(id);
  }

  getFirstName(fullName?: string) {
    return (fullName || '').split(' ')[0] || 'Admin';
  }

  get mock() {
    return {
      currentUser: this.auth.currentUser,
      adminStats: this.stats || this.adminStats,
      machines: this.machines,
      users: this.users,
      trainers: this.trainers,
      allAttendanceAdmin: this.attendance,
      attendance: this.attendance,
    };
  }

  computeRevenue() {
    this.totalRevenue = this.subscriptions
      .filter((s: any) => s.status === 'active')
      .reduce((sum: number, s: any) => sum + (Number(s?.price) || 0), 0);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  toast(msg: string)      { this.successMsg = msg; this.errorMsg = ''; setTimeout(() => this.successMsg = '', 3000); }
  toastError(msg: string) { this.errorMsg = msg; this.successMsg = ''; setTimeout(() => this.errorMsg = '', 5000); }
  formatDate(d: string)   { if (!d) return '—'; const dt = new Date(d); if (isNaN(dt.getTime())) return '—'; return dt.toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  formatTime(d?: string | Date | null) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' });
  }
  formatDuration(min?: number) {
    if (min == null || min < 0) return '—';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }
  formatAttendanceDuration(a: any) {
    return this.formatDuration(a?.duration);
  }
  getAttendanceMethod(a: any): string {
    const labels: Record<string, string> = {
      qrCode: 'QR Code', fingerprint: 'Fingerprint', manual: 'Manual',
      rfid: 'RFID', faceId: 'Face ID',
    };
    return labels[a?.method] || a?.method || '—';
  }
  getStatusColor(s: string) {
    if (s === 'active') return '#34d399';
    if (s === 'maintenance') return '#fb923c';
    if (s === 'outOfService') return '#ff6b6b';
    return '#888';
  }
  getRoleColor(r: string)   { return r === 'admin' || r === 'superAdmin' ? '#DAFF6E' : r === 'trainer' ? '#64b4ff' : '#aaa'; }
  getMemberName(a: any): string {
    if (typeof a.user === 'string') return a.user;
    return a.user?.fullName || a.user?.email || '—';
  }
  getMemberInitial(a: any): string {
    const name = this.getMemberName(a);
    return (name[0] || '?').toUpperCase();
  }
  getSubscriptionUserName(s: any): string {
    if (typeof s.user === 'string') return s.user;
    return s.user?.fullName || s.user?.email || '—';
  }
  getMachineLocation(m: any): string {
    if (typeof m.location === 'string') return m.location;
    if (m.location?.zone) {
      const floor = m.location.floor != null ? `Floor ${m.location.floor}` : '';
      return [floor, `Zone ${m.location.zone}`].filter(Boolean).join(' · ');
    }
    return m.notes || '—';
  }
  getInitials(name: string) { const p = (name||'').trim().split(/\s+/); return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase(); }
}
