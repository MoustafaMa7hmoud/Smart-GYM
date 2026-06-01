import { Routes } from '@angular/router';
import { authGuard, adminGuard, trainerGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/home/home').then(m => m.Home) },
  { path: 'login',    loadComponent: () => import('./components/login/login').then(m => m.Login),        canActivate: [guestGuard] },
  { path: 'register', loadComponent: () => import('./components/register/register').then(m => m.Register), canActivate: [guestGuard] },
  { path: 'forgot-password', loadComponent: () => import('./components/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'subscribe', loadComponent: () => import('./components/subscribe/subscribe').then(m => m.Subscribe), canActivate: [authGuard] },
  { path: 'trainers', loadComponent: () => import('./components/trainers/trainers').then(m => m.Trainers) },
  { path: 'dashboard', loadComponent: () => import('./components/client-dashboard/client-dashboard').then(m => m.ClientDashboard), canActivate: [authGuard] },
  { path: 'admin',    loadComponent: () => import('./components/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),   canActivate: [adminGuard] },
  { path: 'trainer',  loadComponent: () => import('./components/trainer-dashboard/trainer-dashboard').then(m => m.TrainerDashboard), canActivate: [trainerGuard] },
  { path: '**', redirectTo: '' }
];
