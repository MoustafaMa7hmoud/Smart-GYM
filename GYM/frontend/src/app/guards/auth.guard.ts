import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService); const router = inject(Router);
  if (auth.isLoggedIn) return true;
  router.navigate(['/login']); return false;
};
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.isAdmin()) return true;
  router.navigate([auth.userRole === 'trainer' ? '/trainer' : '/dashboard']);
  return false;
};
export const trainerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.userRole === 'trainer' || auth.isAdmin()) return true;
  router.navigate(['/dashboard']);
  return false;
};
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) return true;
  if (auth.isAdmin()) router.navigate(['/admin']);
  else if (auth.userRole === 'trainer') router.navigate(['/trainer']);
  else router.navigate(['/dashboard']);
  return false;
};
