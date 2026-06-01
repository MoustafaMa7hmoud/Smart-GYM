import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ExerciseApiService, WorkoutPlanApiService, TrainerApiService } from '../../services/api.services';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-trainer-dashboard', standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Footer],
  templateUrl: './trainer-dashboard.html', styleUrls: ['./trainer-dashboard.css']
})
export class TrainerDashboard implements OnInit {
  auth       = inject(AuthService);
  exApi      = inject(ExerciseApiService);
  wpApi      = inject(WorkoutPlanApiService);
  trainerApi = inject(TrainerApiService);
  router     = inject(Router);

  activeTab: 'overview'|'clients'|'exercises'|'plans'|'profile' = 'overview';
  tabs = [
    { id: 'overview',  label: 'Overview',        icon: 'fa-th-large'  },
    { id: 'clients',   label: 'My Clients',       icon: 'fa-users'     },
    { id: 'exercises', label: 'Exercise Library', icon: 'fa-running'   },
    { id: 'plans',     label: 'Workout Plans',    icon: 'fa-dumbbell'  },
    { id: 'profile',   label: 'My Profile',       icon: 'fa-user-tie'  },
  ];

  // Data — loaded from API
  exercises: any[]    = [];
  workoutPlans: any[] = [];
  clients: any[]      = [];

  // UI state
  successMsg = '';
  errorMsg   = '';
  selectedExercise: any   = null;
  selectedMuscle: string | null = null;
  showAddExercise = false;
  showAddPlan     = false;
  muscleGroups    = ['chest','back','shoulders','arms','legs','abs'];

  newExercise = { name: '', muscle: 'chest', level: 'beginner', category: 'strength', description: '', tips: '' };
  newPlan     = { title: '', goal: 'muscleGain', level: 'beginner', durationWeeks: 4, daysPerWeek: 3, description: '' };

  // Only specializations that match the backend enum
  allSpecializations = [
    { value: 'bodyBuilding',    label: 'Body Building'     },
    { value: 'weightLoss',      label: 'Weight Loss'       },
    { value: 'nutrition',       label: 'Nutrition'         },
    { value: 'cardio',          label: 'Cardio'            },
    { value: 'yoga',            label: 'Yoga'              },
    { value: 'crossfit',        label: 'CrossFit'          },
    { value: 'pilates',         label: 'Pilates'           },
    { value: 'rehabilitation',  label: 'Rehabilitation'    },
    { value: 'kickboxing',      label: 'Kickboxing'        },
    { value: 'stretching',      label: 'Stretching'        },
  ];

  trainerSpecificPlans: any[]     = [];
  trainerSpecificExercises: any[] = [];

  trainerProfile: any = {
    experience: 5,
    sessionPrice: 320,
    rating: 4.8,
    totalClients: 0,
    bio: 'Experienced coach empowering members with safe, effective training plans tailored to each individual.',
    specializations: ['bodyBuilding', 'nutrition'],
    certificates: [
      { name: 'NASM-CPT', issuedBy: 'NASM', issuedAt: new Date().toISOString().slice(0,10) },
      { name: 'CPR Certified', issuedBy: 'RedCross', issuedAt: new Date().toISOString().slice(0,10) }
    ],
    currency: 'EGP',
    availability: [],
    isAvailable: true,
  };

  trainerId: string | null = null;
  editProfile = false;
  daysOfWeek  = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  loading     = true;

  get mock() {
    return {
      currentUser:  this.auth.currentUser,
      workoutPlans: this.workoutPlans,
      exercises:    this.exercises,
      clients:      this.clients,
    };
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.loadTrainerProfile();
  }

  private getCurrentUserId(): string | null {
    return (this.auth.currentUser as any)?._id || (this.auth.currentUser as any)?.id || null;
  }

  loadTrainerProfile() {
    const uid = this.getCurrentUserId();
    if (!uid) return;

    this.trainerApi.getAll({ user: uid }).subscribe({
      next: (r: any) => {
        let trainer: any = null;
        if (Array.isArray(r) && r.length)                           trainer = r[0];
        else if (r && Array.isArray(r?.trainers) && r.trainers.length) trainer = r.trainers[0];
        else if (r && Array.isArray(r?.data)     && r.data.length)     trainer = r.data[0];
        else if (r && r._id)                                           trainer = r;

        if (trainer) {
          this.trainerId = trainer._id || trainer.id || null;

          // Normalize availability from multiple possible backend shapes
          const avail = trainer.availability ?? trainer.schedule ?? [];
          const normalizedAvail = Array.isArray(avail) ? avail.map((d: any) => ({
            day:   (d.day || d.name || '').toString().toLowerCase(),
            slots: Array.isArray(d.slots) ? d.slots.map((s: any) => ({
              startTime: s.startTime || s.from || s.start || '',
              endTime:   s.endTime   || s.to   || s.end   || '',
            })) : [],
          })) : [];

          this.trainerProfile = {
            experience:      trainer.experience   ?? this.trainerProfile.experience,
            sessionPrice:    trainer.sessionPrice ?? this.trainerProfile.sessionPrice,
            rating:          trainer.rating?.average ?? trainer.rating ?? this.trainerProfile.rating,
            totalClients:    trainer.totalClients ?? this.trainerProfile.totalClients,
            bio:             trainer.bio           || this.trainerProfile.bio,
            specializations: trainer.specializations || this.trainerProfile.specializations,
            certificates:    trainer.certificates    || this.trainerProfile.certificates,
            currency:        trainer.currency        || this.trainerProfile.currency,
            availability:    normalizedAvail.length ? normalizedAvail : this.trainerProfile.availability,
            isAvailable:     trainer.isAvailable ?? this.trainerProfile.isAvailable,
          };

          // ── Load clients from assignedUsers ────────────────────────────────
          // assignedUsers is populated by the backend (fullName, email, role)
          if (Array.isArray(trainer.assignedUsers) && trainer.assignedUsers.length) {
            this.clients = trainer.assignedUsers;
          }

          this.updateTrainerSpecificData();
          this.loadData();
        } else {
          // No trainer profile yet — still load exercises and plans
          this.loadData();
        }
        this.loading = false;
      },
      error: (e: any) => {
        this.loading = false;
        if (e?.status === 401) {
          this.toastError('Session expired — please log in again');
          this.auth.logout();
        } else {
          // No profile found — still load exercises/plans
          this.loadData();
        }
      }
    });
  }

  enterEditProfile() { this.editProfile = true; }

  addCertificate() {
    if (!this.trainerProfile.certificates) this.trainerProfile.certificates = [];
    this.trainerProfile.certificates.push({ name: '', issuedBy: '', issuedAt: new Date().toISOString().slice(0,10) });
  }

  removeCertificate(i: number) {
    this.trainerProfile.certificates?.splice(i, 1);
  }

  addAvailabilityDay() {
    if (!this.trainerProfile.availability) this.trainerProfile.availability = [];
    this.trainerProfile.availability.push({ day: 'monday', slots: [{ startTime: '09:00', endTime: '10:00' }] });
  }

  toggleSpecialization(value: string, checked: boolean) {
    if (!Array.isArray(this.trainerProfile.specializations)) {
      this.trainerProfile.specializations = [];
    }
    const idx = this.trainerProfile.specializations.indexOf(value);
    if (checked && idx === -1) this.trainerProfile.specializations.push(value);
    else if (!checked && idx !== -1) this.trainerProfile.specializations.splice(idx, 1);
  }

  removeAvailabilityDay(i: number)               { this.trainerProfile.availability?.splice(i, 1); }
  addSlot(dayIndex: number) {
    const d = this.trainerProfile.availability?.[dayIndex];
    if (!d) return;
    if (!d.slots) d.slots = [];
    d.slots.push({ startTime: '09:00', endTime: '10:00' });
  }
  removeSlot(dayIndex: number, slotIndex: number) {
    this.trainerProfile.availability?.[dayIndex]?.slots?.splice(slotIndex, 1);
  }

  saveTrainerProfile() {
    const payload: any = {
      bio:             this.trainerProfile.bio,
      experience:      Number(this.trainerProfile.experience)   || 0,
      sessionPrice:    Number(this.trainerProfile.sessionPrice) || 0,
      specializations: Array.isArray(this.trainerProfile.specializations) ? this.trainerProfile.specializations : [],
      availability:    (this.trainerProfile.availability || []).map((d: any) => ({
        day:   String(d.day).toLowerCase(),
        slots: (d.slots || []).map((s: any) => ({ startTime: s.startTime, endTime: s.endTime })),
      })),
      isAvailable: !!this.trainerProfile.isAvailable,
    };

    if (this.trainerProfile.certificates?.length) {
      payload.certificates = this.trainerProfile.certificates.map((c: any) => ({
        name:     c.name,
        issuedBy: c.issuedBy || 'Unknown',
        issuedAt: c.issuedAt ? new Date(c.issuedAt).toISOString() : new Date().toISOString(),
      }));
    }
    if (this.trainerProfile.currency) payload.currency = this.trainerProfile.currency;

    const onSuccess = (res: any) => {
      const trainer = res?.data || res;
      this.trainerId = trainer._id || trainer.id || this.trainerId;
      this.loadTrainerProfile();
      this.editProfile = false;
      this.toast('Profile saved successfully.');
    };

    if (this.trainerId) {
      this.trainerApi.update(this.trainerId, payload).subscribe({
        next: onSuccess,
        error: (e: any) => this.toastError(e?.error?.message || 'Failed to save profile'),
      });
    } else {
      this.trainerApi.create(payload).subscribe({
        next: onSuccess,
        error: (e: any) => {
          if (e?.status === 409) {
            // Profile already exists — find it and update
            this.toastError('Profile already exists. Syncing...');
            const uid = this.getCurrentUserId();
            if (!uid) return;
            this.trainerApi.getAll({ user: uid }).subscribe({
              next: (items: any[]) => {
                const existing = Array.isArray(items) ? items[0] : null;
                if (existing) {
                  this.trainerId = existing._id || existing.id;
                  this.trainerApi.update(this.trainerId!, payload).subscribe({ next: onSuccess, error: (err: any) => this.toastError(err?.error?.message || 'Update failed') });
                }
              },
              error: () => this.toastError('Could not locate existing profile. Refresh and try again.'),
            });
          } else {
            this.toastError(e?.error?.message || 'Failed to create profile');
          }
        },
      });
    }
  }

  loadData() {
    const tId = this.trainerId;

    // Load exercises — filtered by trainer if we have an ID
    const exerciseParams = tId ? { trainerId: tId } : undefined;
    this.exApi.getAll(exerciseParams).subscribe({
      next: (arr: any) => {
        this.exercises = Array.isArray(arr) ? arr : [];
        this.updateTrainerSpecificData();
      },
      error: (e: any) => {
        this.exercises = [];
        if (e?.status === 401) { this.toastError('Session expired'); this.auth.logout(); }
      },
    });

    // Load workout plans
    this.wpApi.getAll().subscribe({
      next: (arr: any) => {
        this.workoutPlans = Array.isArray(arr) ? arr : [];
        this.updateTrainerSpecificData();
      },
      error: (e: any) => {
        this.workoutPlans = [];
        if (e?.status === 401) { this.toastError('Session expired'); this.auth.logout(); }
      },
    });

    // NOTE: clients are already loaded from trainer.assignedUsers in loadTrainerProfile()
    // We do NOT reset this.clients here.
  }

  setTab(t: any) { this.activeTab = t; this.selectedExercise = null; this.selectedMuscle = null; }

  get clientUsers()        { return this.clients.filter((u: any) => !u.role || u.role === 'user'); }
  get userCount()          { return this.clientUsers.length; }
  get trainerPlanCount()   { return this.trainerSpecificPlans.length   || this.workoutPlans.length;  }
  get trainerExerciseCount() { return this.trainerSpecificExercises.length || this.exercises.length; }

  updateTrainerSpecificData() {
    const tId = this.trainerId;
    const planKeys     = ['trainerId', 'trainer', 'author', 'createdBy', 'owner'];
    const exerciseKeys = ['trainerId', 'createdBy', 'author', 'owner'];

    this.trainerSpecificPlans = tId
      ? this.workoutPlans.filter((p: any) => planKeys.some(k => {
          const v = p?.[k];
          return v === tId || (v && typeof v === 'object' && (v._id === tId || v.id === tId));
        }))
      : [];
    if (!this.trainerSpecificPlans.length) this.trainerSpecificPlans = this.workoutPlans;

    this.trainerSpecificExercises = tId
      ? this.exercises.filter((ex: any) => exerciseKeys.some(k => {
          const v = ex?.[k];
          return v === tId || (v && typeof v === 'object' && (v._id === tId || v.id === tId));
        }))
      : [];
    if (!this.trainerSpecificExercises.length) this.trainerSpecificExercises = this.exercises;
  }

  // ── Exercises ────────────────────────────────────────────────────────────────
  get filteredExercises() {
    return this.selectedMuscle
      ? this.exercises.filter((e: any) => e.muscle === this.selectedMuscle)
      : this.exercises;
  }
  selectMuscle(id: string) { this.selectedMuscle = id; this.selectedExercise = null; }
  openExercise(ex: any)    { this.selectedExercise = ex; }
  getExerciseCount(m: string): number { return this.exercises.filter((e: any) => e.muscle === m).length; }

  addExercise() {
    if (!this.newExercise.name) return;
    if (!this.trainerId) { this.toastError('Please complete your trainer profile first'); return; }

    const fd = new FormData();
    fd.append('name',        this.newExercise.name);
    fd.append('muscle',      this.newExercise.muscle);
    fd.append('level',       this.newExercise.level);
    fd.append('category',    this.newExercise.category);
    fd.append('description', this.newExercise.description);
    fd.append('trainerId',   this.trainerId);
    if (this.newExercise.tips) {
      this.newExercise.tips.split(',').forEach((t: string) => fd.append('tips[]', t.trim()));
    }

    this.exApi.create(fd).subscribe({
      next: r => {
        this.exercises = [...this.exercises, r.data];
        this.updateTrainerSpecificData();
        this.showAddExercise = false;
        this.newExercise = { name: '', muscle: 'chest', level: 'beginner', category: 'strength', description: '', tips: '' };
        this.toast('Exercise saved to database!');
      },
      error: e => this.toastError(e?.error?.message || 'Failed to add exercise'),
    });
  }

  generatePlan() {
    this.wpApi.generate({ goal: this.newPlan.goal, level: this.newPlan.level }).subscribe({
      next: () => {
        this.showAddPlan = false;
        this.resetPlanForm();
        this.toast('Workout plan generated!');
        this.wpApi.getAll().subscribe({
          next: (arr: any) => { this.workoutPlans = Array.isArray(arr) ? arr : []; this.updateTrainerSpecificData(); },
          error: () => {},
        });
      },
      error: e => this.toastError(e?.error?.message || 'Failed to generate plan'),
    });
  }

  addPlan()       { this.generatePlan(); }
  resetPlanForm() { this.newPlan = { title: '', goal: 'muscleGain', level: 'beginner', durationWeeks: 4, daysPerWeek: 3, description: '' }; }

  // ── Helpers ──────────────────────────────────────────────────────────────────
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
  getUserInitials(name?: string)  { return this.getInitials(name || ''); }
  getInitials(name: string) {
    const p = (name || '').trim().split(/\s+/);
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
  }
}
