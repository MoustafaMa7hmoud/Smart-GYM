import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('gym_token');
  const router = inject(Router);
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    tap({
      error: (err: any) => {
        if (err?.status === 401) {
          localStorage.removeItem('gym_token');
          localStorage.removeItem('gym_user');
          router.navigate(['/login']);
        }
      }
    })
  );
};
