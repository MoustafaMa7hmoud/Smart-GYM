export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: 'user' | 'trainer' | 'admin' | 'superAdmin';
  profileImage?: { url: string; publicId: string };
  phone?: string;
  gender?: string;
  goal?: string;
  level?: string;
  isActive?: boolean;
  lastLogin?: string;
  age?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
