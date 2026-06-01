import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ExerciseApiService, TrainerApiService, WorkoutPlanApiService } from '../../services/api.services';
import { extractData } from '../../utils/api-response.util';
import {
  DEFAULT_TRAINER_BIO, formatSpecialization, mapTrainerView,
  TRAINER_SPECIALIZATIONS,
} from '../../utils/trainer.util';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-trainer-dashboard', standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Footer],
  templateUrl: './trainer-dashboard.html', styleUrls: ['./trainer-dashboard.css']
})
export class TrainerDashboard implements OnInit {
  auth      = inject(AuthService);
  exApi     = inject(ExerciseApiService);
  wpApi     = inject(WorkoutPlanApiService);
  trainerApi = inject(TrainerApiService);
  router    = inject(Router);

  readonly trainerSpecOptions = TRAINER_SPECIALIZATIONS;
  formatSpec = formatSpecialization;

  activeTab: 'overview'|'clients'|'exercises'|'plans'|'profile' = 'overview';
  tabs = [
    { id: 'overview',  label: 'Overview',        icon: 'fa-th-large'  },
    { id: 'clients',   label: 'My Clients',       icon: 'fa-users'     },
    { id: 'exercises', label: 'Exercise Library', icon: 'fa-running'   },
    { id: 'plans',     label: 'Workout Plans',    icon: 'fa-dumbbell'  },
    { id: 'profile',   label: 'My Profile',       icon: 'fa-user-tie'  },
  ];

  exercises: any[]    = [];
  workoutPlans: any[] = [];
  trainerProfile: any = null;
  trainerProfileId: string | null = null;
  profileLoading = false;
  profileMissing = false;
  editProfileMode = false;
  savingProfile = false;

  profileForm = {
    bio: DEFAULT_TRAINER_BIO,
    experience: 1,
    sessionPrice: 300,
    specializations: ['bodyBuilding'] as string[],
    isAvailable: true,
  };

  successMsg = '';
  errorMsg   = '';
  selectedExercise: any   = null;
  selectedMuscle: string | null = null;
  showAddExercise = false;
  showAddPlan     = false;
  muscleGroups    = ['chest','back','shoulders','arms','legs','abs'];

  newExercise = { name: '', muscle: 'chest', level: 'beginner', category: 'strength', description: '', tips: '' };
  newPlan     = { title: '', goal: 'muscle_gain', level: 'beginner', durationWeeks: 4, daysPerWeek: 3, description: '' };

  ngOnInit() {
    if (!this.auth.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.loadTrainerProfile();
    this.loadData();
  }

  loadTrainerProfile() {
    const uid = this.auth.currentUser?._id;
    if (!uid) return;
    this.profileLoading = true;
    this.trainerApi.getAll({ limit: 100 }).subscribe({
      next: list => {
        const arr = Array.isArray(list) ? list : [];
        const mine = arr.find((t: any) => String(t.user?._id || t.user) === String(uid));
        if (!mine?._id) {
          this.profileMissing = true;
          this.trainerProfile = null;
          this.trainerProfileId = null;
          this.resetProfileForm();
          this.profileLoading = false;
          return;
        }
        this.profileMissing = false;
        this.trainerProfileId = mine._id;
        this.trainerApi.getById(mine._id).subscribe({
          next: res => {
            const raw = extractData(res) ?? res?.data;
            this.trainerProfile = mapTrainerView(raw);
            this.syncProfileForm();
            this.profileLoading = false;
          },
          error: () => {
            this.trainerProfile = mapTrainerView(mine);
            this.syncProfileForm();
            this.profileLoading = false;
          },
        });
      },
      error: () => {
        this.profileLoading = false;
        this.profileMissing = true;
      },
    });
  }

  syncProfileForm() {
    const p = this.trainerProfile;
    if (!p) return;
    this.profileForm = {
      bio: p.bio || DEFAULT_TRAINER_BIO,
      experience: p.experience ?? 0,
      sessionPrice: p.sessionPrice ?? 200,
      specializations: [...(p.specializations || ['bodyBuilding'])],
      isAvailable: p.isAvailable !== false,
    };
  }

  private resetProfileForm() {
    this.profileForm = {
      bio: DEFAULT_TRAINER_BIO,
      experience: 1,
      sessionPrice: 300,
      specializations: ['bodyBuilding'],
      isAvailable: true,
    };
  }

  loadData() {
    this.exApi.getAll().subscribe({
      next: arr => { this.exercises = Array.isArray(arr) ? arr : []; },
      error: ()  => { this.exercises = []; },
    });
    this.wpApi.getAll().subscribe({
      next: arr => { this.workoutPlans = Array.isArray(arr) ? arr : []; },
      error: ()  => { this.workoutPlans = []; },
    });
  }

  setTab(t: any) { this.activeTab = t; this.selectedExercise = null; this.selectedMuscle = null; }

  get clients() {
    return Array.isArray(this.trainerProfile?.assignedUsers)
      ? this.trainerProfile.assignedUsers
      : [];
  }

  get clientUsers() { return this.clients; }
  get userCount()   { return this.clients.length; }
  get isPendingApproval() {
    return this.trainerProfile && this.trainerProfile.isApproved === false;
  }

  toggleProfileSpec(value: string) {
    const specs = this.profileForm.specializations;
    const i = specs.indexOf(value);
    if (i >= 0) {
      if (specs.length > 1) specs.splice(i, 1);
    } else {
      specs.push(value);
    }
  }

  createProfile() {
    if (this.profileForm.bio.trim().length < 50) {
      this.toastError('Bio must be at least 50 characters.');
      return;
    }
    this.savingProfile = true;
    this.trainerApi.create({ ...this.profileForm }).subscribe({
      next: res => {
        const raw = extractData(res) ?? res?.data;
        this.trainerProfile = mapTrainerView(raw);
        this.trainerProfileId = this.trainerProfile?._id;
        this.profileMissing = false;
        this.savingProfile = false;
        this.editProfileMode = false;
        this.toast('Trainer profile created! Awaiting admin approval.');
      },
      error: e => {
        this.savingProfile = false;
        this.toastError(e?.error?.message || 'Failed to create profile');
      },
    });
  }

  saveProfile() {
    if (!this.trainerProfileId) return;
    if (this.profileForm.bio.trim().length < 50) {
      this.toastError('Bio must be at least 50 characters.');
      return;
    }
    this.savingProfile = true;
    this.trainerApi.update(this.trainerProfileId, { ...this.profileForm }).subscribe({
      next: res => {
        const raw = extractData(res) ?? res?.data;
        this.trainerProfile = mapTrainerView(raw);
        this.syncProfileForm();
        this.savingProfile = false;
        this.editProfileMode = false;
        this.toast('Profile updated.');
      },
      error: e => {
        this.savingProfile = false;
        this.toastError(e?.error?.message || 'Failed to update profile');
      },
    });
  }

  get filteredExercises() {
    return this.selectedMuscle
      ? this.exercises.filter((e: any) => e.muscle === this.selectedMuscle)
      : this.exercises;
  }

  selectMuscle(id: string) { this.selectedMuscle = id; this.selectedExercise = null; }
  openExercise(ex: any)    { this.selectedExercise = ex; }

  getExerciseCount(m: string): number {
    return this.exercises.filter((e: any) => e.muscle === m).length;
  }

  addExercise() {
    if (!this.newExercise.name) return;
    const fd = new FormData();
    fd.append('name',        this.newExercise.name);
    fd.append('muscle',      this.newExercise.muscle);
    fd.append('level',       this.newExercise.level);
    fd.append('category',    this.newExercise.category);
    fd.append('description', this.newExercise.description);
    if (this.newExercise.tips) {
      this.newExercise.tips.split(',').forEach((t: string) => fd.append('tips[]', t.trim()));
    }
    this.exApi.create(fd).subscribe({
      next: r  => {
        this.exercises.push(r.data);
        this.showAddExercise = false;
        this.newExercise = { name: '', muscle: 'chest', level: 'beginner', category: 'strength', description: '', tips: '' };
        this.toast('Exercise added!');
      },
      error: e => this.toastError(e?.error?.message || 'Failed to add exercise'),
    });
  }

  generatePlan() {
    this.wpApi.generate({ goal: this.newPlan.goal, level: this.newPlan.level }).subscribe({
      next: r  => {
        this.workoutPlans.unshift(r.data);
        this.showAddPlan = false;
        this.resetPlanForm();
        this.toast('Workout plan generated!');
      },
      error: e => this.toastError(e?.error?.message || 'Failed to generate plan'),
    });
  }

  addPlan() { this.generatePlan(); }

  resetPlanForm() {
    this.newPlan = { title: '', goal: 'muscle_gain', level: 'beginner', durationWeeks: 4, daysPerWeek: 3, description: '' };
  }

  toast(msg: string)      { this.successMsg = msg; setTimeout(() => this.successMsg = '', 3000); }
  toastError(msg: string) { this.errorMsg   = msg; setTimeout(() => this.errorMsg   = '', 4000); }
  formatDate(d: string)   { if (!d) return '—'; return new Date(d).toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  getLevelColor(l: string) { return l === 'beginner' ? '#34d399' : l === 'intermediate' ? '#DAFF6E' : '#fb923c'; }
  getGoalLabel(g: string) {
    const map: Record<string,string> = {
      muscle_gain: 'Muscle Gain', muscleGain: 'Muscle Gain',
      weight_loss: 'Weight Loss', weightLoss: 'Weight Loss',
      fitness: 'General Fitness', generalFitness: 'General Fitness',
      endurance: 'Endurance',
    };
    return map[g] || g;
  }
  getFirstName(fullName?: string) { return (fullName || '').split(' ')[0] || 'Coach'; }
  getUserInitials(name?: string) { return this.getInitials(name || ''); }
  getInitials(name: string) { const p = (name||'').trim().split(/\s+/); return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase(); }
}
