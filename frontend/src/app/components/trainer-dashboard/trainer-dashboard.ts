import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ExerciseApiService, WorkoutPlanApiService, AdminApiService } from '../../services/api.services';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-trainer-dashboard', standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Footer],
  templateUrl: './trainer-dashboard.html', styleUrls: ['./trainer-dashboard.css']
})
export class TrainerDashboard implements OnInit {
  auth    = inject(AuthService);
  exApi   = inject(ExerciseApiService);
  wpApi   = inject(WorkoutPlanApiService);
  userApi = inject(AdminApiService);
  router  = inject(Router);

  activeTab: 'overview'|'clients'|'exercises'|'plans'|'profile' = 'overview';
  tabs = [
    { id: 'overview',  label: 'Overview',        icon: 'fa-th-large'  },
    { id: 'clients',   label: 'My Clients',       icon: 'fa-users'     },
    { id: 'exercises', label: 'Exercise Library', icon: 'fa-running'   },
    { id: 'plans',     label: 'Workout Plans',    icon: 'fa-dumbbell'  },
    { id: 'profile',   label: 'My Profile',       icon: 'fa-user-tie'  },
  ];

  // Data
  exercises: any[]    = [];
  workoutPlans: any[] = [];
  clients: any[]      = [];

  // UI
  successMsg = '';
  errorMsg   = '';
  selectedExercise: any   = null;
  selectedMuscle: string | null = null;
  showAddExercise = false;
  showAddPlan     = false;
  muscleGroups    = ['chest','back','shoulders','arms','legs','abs'];

  newExercise = { name: '', muscle: 'chest', level: 'beginner', category: 'strength', description: '', tips: '' };
  newPlan     = { title: '', goal: 'muscle_gain', level: 'beginner', durationWeeks: 4, daysPerWeek: 3, description: '' };

  trainerProfile: any = {
    experience: 5,
    sessionPrice: 320,
    rating: 4.8,
    totalClients: 12,
    bio: 'Experienced coach empowering members with safe, effective training plans.',
    specializations: ['Strength Training', 'Nutrition', 'Body Recomposition'],
    certificates: ['NASM-CPT', 'CPR Certified']
  };

  get mock() {
    return {
      currentUser: this.auth.currentUser,
      workoutPlans: this.workoutPlans,
      exercises: this.exercises,
      clients: this.clients,
    };
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.loadData();
  }

  loadData() {
    this.exApi.getAll().subscribe({
      next: arr => { this.exercises    = Array.isArray(arr) ? arr : []; },
      error: ()  => { this.exercises   = []; }
    });
    this.wpApi.getAll().subscribe({
      next: arr => { this.workoutPlans = Array.isArray(arr) ? arr : []; },
      error: ()  => { this.workoutPlans= []; }
    });
    this.userApi.getAllUsers().subscribe({
      next: (r: any) => {
        if (Array.isArray(r)) {
          this.clients = r;
        } else if (Array.isArray(r?.data)) {
          this.clients = r.data;
        } else if (Array.isArray(r?.users)) {
          this.clients = r.users;
        } else {
          this.clients = [];
        }
      },
      error: () => { this.clients = []; }
    });
  }

  setTab(t: any) { this.activeTab = t; this.selectedExercise = null; this.selectedMuscle = null; }

  get clientUsers() { return this.clients.filter((u: any) => u.role === 'user'); }
  get userCount()   { return this.clientUsers.length; }

  // Exercises
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
      error: e => this.toastError(e?.error?.message || 'Failed to add exercise')
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
      error: e => this.toastError(e?.error?.message || 'Failed to generate plan')
    });
  }

  addPlan() {
    this.generatePlan();
  }

  resetPlanForm() {
    this.newPlan = { title: '', goal: 'muscle_gain', level: 'beginner', durationWeeks: 4, daysPerWeek: 3, description: '' };
  }

  // Helpers
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
