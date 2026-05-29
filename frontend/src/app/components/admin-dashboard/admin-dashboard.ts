import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminApiService, MachineApiService, TrainerApiService } from '../../services/api.services';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-admin-dashboard', standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Footer],
  templateUrl: './admin-dashboard.html', styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  auth       = inject(AuthService);
  adminApi   = inject(AdminApiService);
  machineApi = inject(MachineApiService);
  trainerApi = inject(TrainerApiService);
  router     = inject(Router);

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

  // UI state
  userSearch   = '';
  selectedUser: any = null;
  editUserMode = false;
  editUserData: any = {};
  successMsg   = '';
  errorMsg     = '';
  loading      = false;

  // Add machine form
  showAddMachine = false;
  newMachine = { name: '', category: 'strength', status: 'active', brand: '', location: '', muscleGroups: '' };

  ngOnInit() {
    if (!this.auth.isLoggedIn || this.auth.userRole !== 'admin') {
      this.router.navigate(['/']);
      return;
    }
    this.loadDashboard();
    this.loadUsers();
    this.loadMachines();
    this.loadTrainers();
    this.loadSubscriptions();
    this.loadAttendance();
  }

  setTab(t: any) { this.activeTab = t; this.selectedUser = null; this.editUserMode = false; }

  // ── Loaders ────────────────────────────────────────────────────────────────
  loadDashboard() {
    this.adminApi.getDashboard().subscribe({
      next: r  => {
        this.stats = r?.data || r || {};
        this.adminStats = this.stats || this.adminStats;
      },
      error: () => {
        this.stats = { totalUsers: 0, totalTrainers: 0, totalActiveSubscriptions: 0, todayAttendanceCount: 0 };
        this.adminStats = this.stats;
      }
    });
  }

  loadUsers() {
    this.adminApi.getAllUsers().subscribe({
      next: (r: any) => {
        if (Array.isArray(r)) {
          this.users = r;
        } else if (Array.isArray(r?.data)) {
          this.users = r.data;
        } else if (Array.isArray(r?.users)) {
          this.users = r.users;
        } else {
          this.users = [];
        }
      },
      error: () => { this.users = []; }
    });
  }

  loadTrainers() {
    this.trainerApi.getAll().subscribe({
      next: (r: any) => {
        if (Array.isArray(r)) {
          this.trainers = r;
        } else if (Array.isArray(r?.data)) {
          this.trainers = r.data;
        } else {
          this.trainers = [];
        }
      },
      error: () => { this.trainers = []; }
    });
  }

  loadMachines() {
    this.machineApi.getAll().subscribe({
      next: (r: any) => {
        if (Array.isArray(r?.data)) {
          this.machines = r.data;
        } else if (Array.isArray(r)) {
          this.machines = r;
        } else {
          this.machines = [];
        }
      },
      error: () => { this.machines = []; }
    });
  }

  loadSubscriptions() {
    this.adminApi.getAllSubscriptions().subscribe({
      next: (r: any) => {
        if (Array.isArray(r)) {
          this.subscriptions = r;
        } else if (Array.isArray(r?.data)) {
          this.subscriptions = r.data;
        } else {
          this.subscriptions = [];
        }
        this.computeRevenue();
      },
      error: () => { this.subscriptions = []; this.computeRevenue(); }
    });
  }

  loadAttendance() {
    this.adminApi.getAllAttendance().subscribe({
      next: (r: any) => {
        if (Array.isArray(r)) {
          this.attendance = r;
        } else if (Array.isArray(r?.data)) {
          this.attendance = r.data;
        } else if (Array.isArray(r?.records)) {
          this.attendance = r.records;
        } else if (Array.isArray(r?.logs)) {
          this.attendance = r.logs;
        } else {
          this.attendance = [];
        }
      },
      error: () => { this.attendance = []; }
    });
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
    Object.assign(this.selectedUser, this.editUserData);
    this.editUserMode = false;
    this.toast('User updated!');
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
  approveTrainer(id: string) {
    this.trainerApi.approve(id).subscribe({
      next: () => {
        const t = this.trainers.find((t: any) => t._id === id);
        if (t) t.isApproved = true;
        this.toast('Trainer approved!');
      },
      error: e => this.toastError(e?.error?.message || 'Approval failed')
    });
  }

  // ── Machines ───────────────────────────────────────────────────────────────
  addMachine() {
    if (!this.newMachine.name) return;
    this.machineApi.create({
      ...this.newMachine,
      muscleGroups: this.newMachine.muscleGroups.split(',').map((s: string) => s.trim()).filter(Boolean),
    }).subscribe({
      next: r  => {
        this.machines.push(r.data);
        this.showAddMachine = false;
        this.newMachine = { name: '', category: 'strength', status: 'active', brand: '', location: '', muscleGroups: '' };
        this.toast('Machine added!');
      },
      error: e => this.toastError(e?.error?.message || 'Failed to add machine')
    });
  }

  deleteMachine(id: string) {
    if (!confirm('Delete this machine?')) return;
    this.machineApi.delete(id).subscribe({
      next: () => {
        this.machines = this.machines.filter((m: any) => m._id !== id);
        this.toast('Machine removed.');
      },
      error: e => this.toastError(e?.error?.message || 'Failed to delete')
    });
  }

  toggleMachineStatus(m: any) {
    const newStatus = m.status === 'active' ? 'maintenance' : 'active';
    this.machineApi.update(m._id, { status: newStatus }).subscribe({
      next: () => { m.status = newStatus; this.toast('Status updated.'); },
      error: e => this.toastError(e?.error?.message || 'Failed to update status')
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
    this.totalRevenue = this.subscriptions.reduce((sum: number, s: any) => sum + (Number(s?.price) || 0), 0);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  toast(msg: string)      { this.successMsg = msg; setTimeout(() => this.successMsg = '', 3000); }
  toastError(msg: string) { this.errorMsg   = msg; setTimeout(() => this.errorMsg   = '', 4000); }
  formatDate(d: string)   { if (!d) return '—'; return new Date(d).toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  formatDuration(min?: number) { if (!min) return '—'; const h = Math.floor(min/60); const m = min%60; return h ? `${h}h ${m}m` : `${m}m`; }
  getStatusColor(s: string) { return s === 'active' ? '#34d399' : s === 'maintenance' ? '#fb923c' : '#ff6b6b'; }
  getRoleColor(r: string)   { return r === 'admin' ? '#DAFF6E' : r === 'trainer' ? '#64b4ff' : '#aaa'; }
  getInitials(name: string) { const p = (name||'').trim().split(/\s+/); return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase(); }
}
