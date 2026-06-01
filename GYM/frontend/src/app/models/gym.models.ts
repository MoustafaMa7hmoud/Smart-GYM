export interface Exercise {
  _id: string;
  name: string;
  muscle: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  description?: string;
  tips?: string[];
  mistakes?: string[];
  video?: string;
  image?: string;
  isActive?: boolean;
  machine?: string | Machine;
}

export interface Machine {
  _id: string;
  name: string;
  nameAr?: string;
  category: string;
  muscleGroups: string[];
  status: 'active' | 'maintenance' | 'outOfService' | 'retired';
  brand?: string;
  location?: { floor: number; zone: string };
  images?: string[];
  instructions?: string;
  notes?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}

export interface Subscription {
  _id: string;
  user: string;
  plan: 'basic' | 'standard' | 'premium';
  price: number;
  currency: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  features: string[];
  paymentRef?: string;
}

export interface SubscriptionPlan {
  plan: string;
  pricePerMonth: number;
  features: string[];
}

export interface Payment {
  _id: string;
  user: string;
  subscription: string;
  amount: number;
  amountEGP: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  method: string;
  iframeUrl?: string;
  invoiceNumber?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Attendance {
  _id: string;
  user: string | { fullName: string; email: string };
  subscription?: string;
  checkIn: string;
  checkOut?: string;
  duration?: number;
  method: string;
  notes?: string;
}

export interface BodyMeasurement {
  _id: string;
  user: string;
  date: string;
  weight?: number;
  height?: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  measurements?: {
    chest?: number; waist?: number; hips?: number;
    leftArm?: number; rightArm?: number;
    leftThigh?: number; rightThigh?: number;
  };
  bmi?: number;
  bmiCategory?: string;
  notes?: string;
}

export interface WorkoutLog {
  _id: string;
  user: string;
  workoutPlan?: string;
  date: string;
  duration: number;
  caloriesBurned?: number;
  mood?: string;
  energyLevel?: number;
  notes?: string;
}

export interface Progress {
  _id: string;
  user: string;
  exercise: string | Exercise;
  date: string;
  sets: { setNumber: number; reps: number; weight: number; completed: boolean }[];
  totalVolume: number;
  notes?: string;
}

export interface WorkoutPlan {
  _id: string;
  title: string;
  description?: string;
  createdBy: string;
  assignedTo?: string;
  goal: string;
  level: string;
  durationWeeks: number;
  daysPerWeek: number;
  status: 'draft' | 'active' | 'archived';
  isPublic: boolean;
  isTemplate: boolean;
  days?: WorkoutDay[];
}

export interface WorkoutDay {
  dayNumber: number;
  dayName?: string;
  muscleGroups?: string[];
  isRestDay?: boolean;
  exercises?: WorkoutDayExercise[];
  estimatedDuration?: number;
}

export interface WorkoutDayExercise {
  exercise: string | Exercise;
  order: number;
  sets: number;
  reps?: string;
  restSeconds?: number;
  notes?: string;
}

export interface Trainer {
  _id: string;
  user: string | TrainerUser;
  specializations: string[];
  bio: string;
  experience: number;
  sessionPrice: number;
  currency: string;
  rating: { average: number; count: number };
  totalClients: number;
  isApproved: boolean;
  isAvailable: boolean;
  certificates?: { name: string; issuedBy: string; issuedAt: string }[];
}

export interface TrainerUser {
  _id: string;
  fullName: string;
  email: string;
  profileImage?: { url: string };
}

export interface AdminStats {
  totalUsers: number;
  totalTrainers: number;
  totalActiveSubscriptions: number;
  todayAttendanceCount: number;
}
