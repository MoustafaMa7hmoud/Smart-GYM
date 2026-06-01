import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// ── Types ──────────────────────────────────────────────────────────────
export interface MockUser {
  _id: string; fullName: string; email: string; role: 'user'|'trainer'|'admin';
  phone?: string; gender?: string; goal?: string; level?: string;
  weight?: number; height?: number; profileImage?: string; joinDate: string;
}
export interface MockExercise {
  _id: string; name: string; muscle: string; level: string; category: string;
  description: string; tips: string[]; video?: string; image?: string;
}
export interface MockPlan {
  _id: string; title: string; goal: string; level: string;
  durationWeeks: number; daysPerWeek: number; status: string;
  description: string; isPublic: boolean;
}
export interface MockAttendance {
  _id: string; checkIn: string; checkOut?: string; duration?: number; method: string;
}
export interface MockMeasurement {
  _id: string; date: string; weight: number; height: number;
  bodyFatPercentage?: number; muscleMassKg?: number; bmi: number; bmiCategory: string;
  measurements?: { chest?: number; waist?: number; hips?: number; leftArm?: number; };
}
export interface MockSubscription {
  _id: string; plan: string; price: number; status: string;
  startDate: string; endDate: string; durationMonths: number; features: string[];
}
export interface MockTrainer {
  _id: string; fullName: string; email: string; specializations: string[];
  bio: string; experience: number; sessionPrice: number;
  rating: number; totalClients: number; isApproved: boolean;
  profileImage?: string; certificates: string[];
}
export interface MockMachine {
  _id: string; name: string; category: string; muscleGroups: string[];
  status: 'active'|'maintenance'|'outOfService'; brand: string;
  location: string; lastMaintenance?: string;
}
export interface MockPayment {
  _id: string; amount: number; status: string; method: string;
  plan: string; createdAt: string; invoiceNumber: string;
}
export interface AdminStats {
  totalUsers: number; totalTrainers: number;
  totalActiveSubscriptions: number; todayAttendanceCount: number;
}

@Injectable({ providedIn: 'root' })
export class MockService {

  // ─── Logged-in user state ──────────────────────────────────────────
  private _currentUser$ = new BehaviorSubject<MockUser | null>(this.loadStoredUser());
  currentUser$ = this._currentUser$.asObservable();
  get currentUser() { return this._currentUser$.value; }

  private loadStoredUser(): MockUser | null {
    try { const u = localStorage.getItem('gym_user'); return u ? JSON.parse(u) : null; }
    catch { return null; }
  }
  get isLoggedIn() { return !!this._currentUser$.value; }
  get userRole() { return this._currentUser$.value?.role ?? ''; }

  login(email: string, password: string): { success: boolean; error?: string } {
    const user = this.users.find(u => u.email === email);
    if (!user) return { success: false, error: 'Email not found' };
    // mock: any password works for demo
    localStorage.setItem('gym_user', JSON.stringify(user));
    localStorage.setItem('gym_token', 'mock-jwt-token-' + user._id);
    this._currentUser$.next(user);
    return { success: true };
  }

  register(data: any): { success: boolean; error?: string } {
    if (this.users.find(u => u.email === data.email))
      return { success: false, error: 'Email already exists' };
    const newUser: MockUser = {
      _id: 'u' + Date.now(), fullName: data.fullName, email: data.email,
      role: 'user', phone: data.phone, gender: data.gender,
      weight: data.weight, height: data.height, joinDate: new Date().toISOString()
    };
    this.users.push(newUser);
    localStorage.setItem('gym_user', JSON.stringify(newUser));
    localStorage.setItem('gym_token', 'mock-jwt-' + newUser._id);
    this._currentUser$.next(newUser);
    return { success: true };
  }

  logout() {
    localStorage.removeItem('gym_user');
    localStorage.removeItem('gym_token');
    this._currentUser$.next(null);
  }

  updateCurrentUser(data: Partial<MockUser>) {
    if (!this._currentUser$.value) return;
    const updated = { ...this._currentUser$.value, ...data };
    localStorage.setItem('gym_user', JSON.stringify(updated));
    this._currentUser$.next(updated);
    const idx = this.users.findIndex(u => u._id === updated._id);
    if (idx > -1) this.users[idx] = updated;
  }

  // ─── Mock Data ────────────────────────────────────────────────────

  users: MockUser[] = [
    { _id: 'u1', fullName: 'Ahmed Mohamed', email: 'admin@gym.com', role: 'admin',
      phone: '01012345678', gender: 'male', joinDate: '2024-01-10', goal: 'Muscle Gain' },
    { _id: 'u2', fullName: 'Sara Ali', email: 'trainer@gym.com', role: 'trainer',
      phone: '01112345678', gender: 'female', joinDate: '2024-02-15' },
    { _id: 'u3', fullName: 'Mohamed Hassan', email: 'user@gym.com', role: 'user',
      phone: '01212345678', gender: 'male', weight: 80, height: 178,
      goal: 'Weight Loss', level: 'intermediate', joinDate: '2024-03-01' },
    { _id: 'u4', fullName: 'Nour Khaled', email: 'nour@gym.com', role: 'user',
      phone: '01512345678', gender: 'female', weight: 65, height: 165,
      goal: 'Muscle Gain', level: 'beginner', joinDate: '2024-04-10' },
    { _id: 'u5', fullName: 'Omar Tarek', email: 'omar@gym.com', role: 'user',
      phone: '01012341234', gender: 'male', weight: 90, height: 182,
      goal: 'Endurance', level: 'advanced', joinDate: '2024-01-20' },
  ];

  exercises: MockExercise[] = [
    { _id: 'ex1', name: 'Barbell Bench Press', muscle: 'chest', level: 'intermediate',
      category: 'strength', description: 'The king of chest exercises. Builds overall chest mass and strength.',
      tips: ['Keep shoulder blades retracted', 'Feet flat on floor', 'Control the descent'],
      video: 'https://www.youtube.com/embed/gRVjAtPip0Y' },
    { _id: 'ex2', name: 'Incline Dumbbell Press', muscle: 'chest', level: 'beginner',
      category: 'strength', description: 'Targets the upper chest for complete development.',
      tips: ['Set bench at 30-45 degrees', 'Full range of motion', 'Squeeze at top'],
      video: 'https://www.youtube.com/embed/8iPEnn-ltC8' },
    { _id: 'ex3', name: 'Lat Pulldowns', muscle: 'back', level: 'beginner',
      category: 'strength', description: 'Essential for building back width and lat development.',
      tips: ['Pull to upper chest', 'Lean back slightly', 'Control the negative'],
      video: 'https://www.youtube.com/embed/CAwf7n6Luuc' },
    { _id: 'ex4', name: 'Deadlift', muscle: 'back', level: 'advanced',
      category: 'strength', description: 'The ultimate full-body compound movement.',
      tips: ['Keep back straight', 'Drive through heels', 'Hinge at hips'],
      video: 'https://www.youtube.com/embed/op9kVnSso6Q' },
    { _id: 'ex5', name: 'Overhead Press', muscle: 'shoulders', level: 'intermediate',
      category: 'strength', description: 'Best shoulder mass builder.',
      tips: ['Brace core', 'Press in a straight line', 'Full lockout at top'],
      video: 'https://www.youtube.com/embed/2yjwXTZQDDI' },
    { _id: 'ex6', name: 'Lateral Raises', muscle: 'shoulders', level: 'beginner',
      category: 'strength', description: 'Isolates the medial deltoid for shoulder width.',
      tips: ['Slight bend in elbow', 'Lead with elbows', 'Control the descent'],
      video: 'https://www.youtube.com/embed/3VcKaXpzqRo' },
    { _id: 'ex7', name: 'Barbell Curl', muscle: 'arms', level: 'beginner',
      category: 'strength', description: 'Classic bicep builder.',
      tips: ['No swinging', 'Full squeeze at top', 'Control negative'],
      video: 'https://www.youtube.com/embed/kwG2ipFRgfo' },
    { _id: 'ex8', name: 'Tricep Dips', muscle: 'arms', level: 'intermediate',
      category: 'strength', description: 'Best tricep mass builder.',
      tips: ['Lean forward slightly', 'Go to 90 degrees', 'Lock out at top'],
      video: 'https://www.youtube.com/embed/2z8JmcrW-As' },
    { _id: 'ex9', name: 'Squat', muscle: 'legs', level: 'intermediate',
      category: 'strength', description: 'King of leg exercises for overall lower body development.',
      tips: ['Knees track toes', 'Break parallel', 'Keep chest up'],
      video: 'https://www.youtube.com/embed/ultWZbUMPL8' },
    { _id: 'ex10', name: 'Romanian Deadlift', muscle: 'legs', level: 'intermediate',
      category: 'strength', description: 'Best hamstring exercise for length and size.',
      tips: ['Hinge at hips', 'Keep bar close', 'Feel stretch in hamstrings'],
      video: 'https://www.youtube.com/embed/2SHsk9AzdjA' },
    { _id: 'ex11', name: 'Plank', muscle: 'abs', level: 'beginner',
      category: 'strength', description: 'Core stability essential.',
      tips: ['Neutral spine', 'Squeeze glutes', 'Breathe steadily'],
      video: 'https://www.youtube.com/embed/ASdvN_XEl_c' },
    { _id: 'ex12', name: 'Cable Crunch', muscle: 'abs', level: 'beginner',
      category: 'strength', description: 'Best weighted ab exercise.',
      tips: ['Round the back', 'Contract abs fully', 'Control the weight'],
      video: 'https://www.youtube.com/embed/2fbujeH3F0E' },
  ];

  workoutPlans: MockPlan[] = [
    { _id: 'wp1', title: 'Beginner Full Body', goal: 'generalFitness', level: 'beginner',
      durationWeeks: 8, daysPerWeek: 3, status: 'active', isPublic: true,
      description: 'Perfect for those starting their fitness journey. Full body 3x per week.' },
    { _id: 'wp2', title: 'Muscle Building Program', goal: 'muscleGain', level: 'intermediate',
      durationWeeks: 12, daysPerWeek: 5, status: 'active', isPublic: true,
      description: 'Hypertrophy-focused program. Push/Pull/Legs split.' },
    { _id: 'wp3', title: 'Fat Loss Cardio Plan', goal: 'weightLoss', level: 'beginner',
      durationWeeks: 6, daysPerWeek: 4, status: 'active', isPublic: true,
      description: 'High-intensity workouts designed to maximize fat burning.' },
    { _id: 'wp4', title: 'Advanced Strength', goal: 'muscleGain', level: 'advanced',
      durationWeeks: 16, daysPerWeek: 6, status: 'active', isPublic: true,
      description: 'Powerbuilding program for experienced lifters.' },
  ];

  trainers: MockTrainer[] = [
    { _id: 't1', fullName: 'Coach Kareem Adel', email: 'kareem@gym.com',
      specializations: ['Strength Training', 'Powerlifting', 'Body Recomposition'],
      bio: 'Former national powerlifting champion with 8 years of coaching experience.',
      experience: 8, sessionPrice: 350, rating: 4.9, totalClients: 47,
      isApproved: true, certificates: ['NASM-CPT', 'CSCS', 'Precision Nutrition L1'] },
    { _id: 't2', fullName: 'Coach Nadia Sherif', email: 'nadia@gym.com',
      specializations: ['Weight Loss', 'Nutrition', 'Pilates'],
      bio: 'Specialist in transforming bodies through smart training and nutrition coaching.',
      experience: 5, sessionPrice: 280, rating: 4.7, totalClients: 63,
      isApproved: true, certificates: ['ACE-CPT', 'Precision Nutrition L2'] },
    { _id: 't3', fullName: 'Coach Youssef Magdy', email: 'youssef@gym.com',
      specializations: ['Bodybuilding', 'Muscle Gain', 'Competition Prep'],
      bio: 'IFBB competition coach. Helped 12 athletes win national titles.',
      experience: 10, sessionPrice: 500, rating: 5.0, totalClients: 31,
      isApproved: true, certificates: ['ISSA-CPT', 'IFBB Coach'] },
  ];

  machines: MockMachine[] = [
    { _id: 'm1', name: 'Smith Machine', category: 'strength', muscleGroups: ['chest','legs','shoulders'],
      status: 'active', brand: 'LifeFitness', location: 'Floor 1 - Zone A' },
    { _id: 'm2', name: 'Cable Crossover', category: 'strength', muscleGroups: ['chest','back','arms'],
      status: 'active', brand: 'Hammer Strength', location: 'Floor 1 - Zone B' },
    { _id: 'm3', name: 'Leg Press', category: 'strength', muscleGroups: ['legs'],
      status: 'active', brand: 'Precor', location: 'Floor 2 - Zone A' },
    { _id: 'm4', name: 'Treadmill #3', category: 'cardio', muscleGroups: ['legs','cardio'],
      status: 'maintenance', brand: 'NordicTrack', location: 'Floor 1 - Zone C', lastMaintenance: '2025-05-01' },
    { _id: 'm5', name: 'Rowing Machine', category: 'cardio', muscleGroups: ['back','arms','cardio'],
      status: 'active', brand: 'Concept2', location: 'Floor 1 - Zone C' },
    { _id: 'm6', name: 'Lat Pulldown Machine', category: 'strength', muscleGroups: ['back','arms'],
      status: 'active', brand: 'LifeFitness', location: 'Floor 2 - Zone B' },
  ];

  attendance: MockAttendance[] = [
    { _id: 'a1', checkIn: '2025-05-20T08:30:00', checkOut: '2025-05-20T10:15:00', duration: 105, method: 'qrCode' },
    { _id: 'a2', checkIn: '2025-05-18T07:00:00', checkOut: '2025-05-18T08:45:00', duration: 105, method: 'manual' },
    { _id: 'a3', checkIn: '2025-05-16T18:00:00', checkOut: '2025-05-16T19:30:00', duration: 90, method: 'qrCode' },
    { _id: 'a4', checkIn: '2025-05-14T08:00:00', checkOut: '2025-05-14T09:50:00', duration: 110, method: 'qrCode' },
    { _id: 'a5', checkIn: '2025-05-12T17:30:00', checkOut: '2025-05-12T19:00:00', duration: 90, method: 'manual' },
    { _id: 'a6', checkIn: '2025-05-25T09:00:00', duration: undefined, method: 'qrCode' },
  ];

  measurements: MockMeasurement[] = [
    { _id: 'bm1', date: '2025-03-01', weight: 85, height: 178, bodyFatPercentage: 22,
      muscleMassKg: 38, bmi: 26.8, bmiCategory: 'Overweight',
      measurements: { chest: 102, waist: 88, hips: 98, leftArm: 36 } },
    { _id: 'bm2', date: '2025-04-01', weight: 82, height: 178, bodyFatPercentage: 20,
      muscleMassKg: 39, bmi: 25.8, bmiCategory: 'Normal',
      measurements: { chest: 104, waist: 85, hips: 96, leftArm: 37 } },
    { _id: 'bm3', date: '2025-05-01', weight: 79, height: 178, bodyFatPercentage: 18,
      muscleMassKg: 40, bmi: 24.9, bmiCategory: 'Normal',
      measurements: { chest: 106, waist: 82, hips: 94, leftArm: 38 } },
  ];

  subscription: MockSubscription = {
    _id: 'sub1', plan: 'Standard', price: 399, status: 'active',
    startDate: '2025-04-01', endDate: '2025-07-01', durationMonths: 3,
    features: ['Workout Plans', 'Progress Tracking', 'Trainer Assignment', 'Priority Support']
  };

  payments: MockPayment[] = [
    { _id: 'pay1', amount: 399, status: 'success', method: 'Paymob', plan: 'Standard',
      createdAt: '2025-04-01', invoiceNumber: 'INV-2025-00042' },
    { _id: 'pay2', amount: 199, status: 'success', method: 'Paymob', plan: 'Basic',
      createdAt: '2025-01-01', invoiceNumber: 'INV-2025-00008' },
  ];

  adminStats: AdminStats = {
    totalUsers: 128, totalTrainers: 7,
    totalActiveSubscriptions: 94, todayAttendanceCount: 23
  };

  allUsersAdmin = this.users;
  allAttendanceAdmin = [
    { user: 'Mohamed Hassan', checkIn: '2025-05-25T09:00:00', checkOut: '2025-05-25T10:30:00', duration: 90, method: 'qrCode' },
    { user: 'Nour Khaled', checkIn: '2025-05-25T08:00:00', checkOut: '2025-05-25T09:45:00', duration: 105, method: 'manual' },
    { user: 'Omar Tarek', checkIn: '2025-05-25T07:30:00', checkOut: '2025-05-25T09:00:00', duration: 90, method: 'qrCode' },
  ];
}
