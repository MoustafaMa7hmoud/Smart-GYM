import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SafePipe } from '../../safe.pipe';
import { AuthService } from '../../services/auth.service';
import { TrainerApiService } from '../../services/api.services';
import { formatSpecialization, mapTrainerView } from '../../utils/trainer.util';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

// Static mock data for the public home page (exercises/plans/trainers shown to everyone)
const EXERCISES = [
  { _id: 'ex1', name: 'Barbell Bench Press', muscle: 'chest', level: 'intermediate', category: 'strength', description: 'The king of chest exercises. Builds overall chest mass and strength.', tips: ['Keep shoulder blades retracted', 'Feet flat on floor', 'Control the descent'], video: 'https://www.youtube.com/embed/gRVjAtPip0Y' },
  { _id: 'ex2', name: 'Incline Dumbbell Press', muscle: 'chest', level: 'beginner', category: 'strength', description: 'Targets the upper chest for complete development.', tips: ['Set bench at 30-45 degrees', 'Full range of motion', 'Squeeze at top'], video: 'https://www.youtube.com/embed/8iPEnn-ltC8' },
  { _id: 'ex3', name: 'Lat Pulldowns', muscle: 'back', level: 'beginner', category: 'strength', description: 'Essential for building back width and lat development.', tips: ['Pull to upper chest', 'Lean back slightly', 'Control the negative'], video: 'https://www.youtube.com/embed/CAwf7n6Luuc' },
  { _id: 'ex4', name: 'Deadlift', muscle: 'back', level: 'advanced', category: 'strength', description: 'The ultimate full-body compound movement.', tips: ['Keep back straight', 'Drive through heels', 'Hinge at hips'], video: 'https://www.youtube.com/embed/op9kVnSso6Q' },
  { _id: 'ex5', name: 'Overhead Press', muscle: 'shoulders', level: 'intermediate', category: 'strength', description: 'Best shoulder mass builder.', tips: ['Brace core', 'Press in a straight line', 'Full lockout at top'], video: 'https://www.youtube.com/embed/2yjwXTZQDDI' },
  { _id: 'ex6', name: 'Lateral Raises', muscle: 'shoulders', level: 'beginner', category: 'strength', description: 'Isolates the medial deltoid for shoulder width.', tips: ['Slight bend in elbow', 'Lead with elbows', 'Control the descent'], video: 'https://www.youtube.com/embed/3VcKaXpzqRo' },
  { _id: 'ex7', name: 'Barbell Curl', muscle: 'arms', level: 'beginner', category: 'strength', description: 'Classic bicep builder.', tips: ['No swinging', 'Full squeeze at top', 'Control negative'], video: 'https://www.youtube.com/embed/kwG2ipFRgfo' },
  { _id: 'ex8', name: 'Tricep Dips', muscle: 'arms', level: 'intermediate', category: 'strength', description: 'Best tricep mass builder.', tips: ['Lean forward slightly', 'Go to 90 degrees', 'Lock out at top'], video: 'https://www.youtube.com/embed/2z8JmcrW-As' },
  { _id: 'ex9', name: 'Squat', muscle: 'legs', level: 'intermediate', category: 'strength', description: 'King of leg exercises for overall lower body development.', tips: ['Knees track toes', 'Break parallel', 'Keep chest up'], video: 'https://www.youtube.com/embed/ultWZbUMPL8' },
  { _id: 'ex10', name: 'Romanian Deadlift', muscle: 'legs', level: 'intermediate', category: 'strength', description: 'Best hamstring exercise.', tips: ['Hinge at hips', 'Keep bar close', 'Feel stretch in hamstrings'], video: 'https://www.youtube.com/embed/2SHsk9AzdjA' },
  { _id: 'ex11', name: 'Plank', muscle: 'abs', level: 'beginner', category: 'strength', description: 'Core stability essential.', tips: ['Neutral spine', 'Squeeze glutes', 'Breathe steadily'], video: 'https://www.youtube.com/embed/ASdvN_XEl_c' },
  { _id: 'ex12', name: 'Cable Crunch', muscle: 'abs', level: 'beginner', category: 'strength', description: 'Best weighted ab exercise.', tips: ['Round the back', 'Contract abs fully', 'Control the weight'], video: 'https://www.youtube.com/embed/2fbujeH3F0E' },
];

const PLANS = [
  { _id: 'wp1', title: 'Beginner Full Body', goal: 'generalFitness', level: 'beginner', durationWeeks: 8, daysPerWeek: 3, description: 'Perfect for those starting their fitness journey. Full body 3x per week.' },
  { _id: 'wp2', title: 'Muscle Building Program', goal: 'muscleGain', level: 'intermediate', durationWeeks: 12, daysPerWeek: 5, description: 'Hypertrophy-focused Push/Pull/Legs split.' },
  { _id: 'wp3', title: 'Fat Loss Cardio Plan', goal: 'weightLoss', level: 'beginner', durationWeeks: 6, daysPerWeek: 4, description: 'High-intensity workouts designed to maximize fat burning.' },
  { _id: 'wp4', title: 'Advanced Strength', goal: 'muscleGain', level: 'advanced', durationWeeks: 16, daysPerWeek: 6, description: 'Powerbuilding program for experienced lifters.' },
];

const TRAINERS = [
  { _id: 't1', fullName: 'Coach Kareem Adel', specializations: ['Strength Training', 'Powerlifting', 'Body Recomposition'], bio: 'Former national powerlifting champion with 8 years of coaching experience.', experience: 8, sessionPrice: 350, rating: 4.9, totalClients: 47, certificates: ['NASM-CPT', 'CSCS'] },
  { _id: 't2', fullName: 'Coach Nadia Sherif', specializations: ['Weight Loss', 'Nutrition', 'Pilates'], bio: 'Specialist in transforming bodies through smart training and nutrition coaching.', experience: 5, sessionPrice: 280, rating: 4.7, totalClients: 63, certificates: ['ACE-CPT', 'PN Level 2'] },
  { _id: 't3', fullName: 'Coach Youssef Magdy', specializations: ['Bodybuilding', 'Muscle Gain', 'Competition Prep'], bio: 'IFBB competition coach. Helped 12 athletes win national titles.', experience: 10, sessionPrice: 500, rating: 5.0, totalClients: 31, certificates: ['ISSA-CPT', 'IFBB Coach'] },
];

@Component({
  selector: 'app-home', standalone: true,
  imports: [CommonModule, RouterLink, SafePipe, Navbar, Footer],
  templateUrl: './home.html', styleUrls: ['./home.css']
})
export class Home implements OnInit {
  auth   = inject(AuthService);
  router = inject(Router);
  trainerApi = inject(TrainerApiService);
  formatSpec = formatSpecialization;

  selectedMuscle: string | null = null;
  selectedExercise: any = null;
  selectedPlan: any = null;
  selectedTrainer: any = null;
  currentSection: 'exercises' | null = null;

  muscleGroups = [
    { id: 'chest', label: 'Chest', icon: 'fa-shield-alt', color: '#ff6b6b' },
    { id: 'back', label: 'Back', icon: 'fa-arrow-up', color: '#64b4ff' },
    { id: 'shoulders', label: 'Shoulders', icon: 'fa-expand-arrows-alt', color: '#a78bfa' },
    { id: 'arms', label: 'Arms', icon: 'fa-fist-raised', color: '#DAFF6E' },
    { id: 'legs', label: 'Legs', icon: 'fa-running', color: '#fb923c' },
    { id: 'abs', label: 'Core & Abs', icon: 'fa-star', color: '#34d399' },
  ];

  pricingPlans = [
    { name: 'Basic', price: 199, color: '#888', badge: '',
      period: '/month',
      features: ['Access to all workout plans', 'Progress tracking', 'Exercise library', 'Community access'] },
    { name: 'Standard', price: 399, color: '#DAFF6E', badge: 'Most Popular',
      period: '/month',
      features: ['All Basic features', 'Trainer assignment', 'Nutrition tips', 'Priority support', 'Custom goals'] },
    { name: 'Premium', price: 699, color: '#a78bfa', badge: '',
      period: '/month',
      features: ['All Standard features', 'Personal trainer sessions', 'Custom workout plans', 'Diet consultation', 'Dedicated support'] },
  ];

  exercises = EXERCISES;
  workoutPlans = PLANS;
  trainers = TRAINERS;

  get isLoggedIn() { return this.auth.isLoggedIn; }
  get filteredExercises() { return this.selectedMuscle ? this.exercises.filter(e => e.muscle === this.selectedMuscle) : this.exercises; }

  ngOnInit() {
    this.trainerApi.getAll({ limit: 50, sort: '-rating.average' }).subscribe({
      next: list => {
        const mapped = (Array.isArray(list) ? list : [])
          .filter((t: any) => t.isApproved !== false)
          .map((t: any) => {
            const v = mapTrainerView(t);
            return {
              ...v,
              certificates: v.certificateLabels?.length ? v.certificateLabels : [],
            };
          });
        if (mapped.length) this.trainers = mapped;
      },
    });
  }

  selectMuscle(id: string) { this.selectedMuscle = id; this.currentSection = 'exercises'; window.scrollTo(0,0); }
  openExercise(ex: any) { this.selectedExercise = ex; window.scrollTo(0,0); }
  closeExercise() { this.selectedExercise = null; }
  openPlan(p: any) { this.selectedPlan = p; window.scrollTo(0,0); }
  closePlan() { this.selectedPlan = null; }
  openTrainer(t: any) { this.selectedTrainer = t; window.scrollTo(0,0); }
  closeTrainer() { this.selectedTrainer = null; }
  backToMuscles() { this.selectedMuscle = null; this.selectedExercise = null; this.currentSection = null; }
  scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
  getExerciseCount(muscle: string): number { return this.exercises.filter(e => e.muscle === muscle).length; }
  getLevelColor(l: string) { return l === 'beginner' ? '#34d399' : l === 'intermediate' ? '#DAFF6E' : '#fb923c'; }
  getGoalLabel(g: string) {
    const map: any = { muscleGain: 'Muscle Gain', weightLoss: 'Weight Loss', generalFitness: 'General Fitness', endurance: 'Endurance' };
    return map[g] || g;
  }
  getInitials(name: string): string {
    const p = name.trim().split(/\s+/);
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
  }
}
