import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-register', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, Footer],
  templateUrl: './register.html', styleUrls: ['./register.css']
})
export class Register {
  private auth   = inject(AuthService);
  private router = inject(Router);
  fullName = ''; email = ''; password = ''; confirmPassword = '';
  phone = ''; gender = ''; dateOfBirth = '';
  loading = false; error = ''; step = 1;

  nextStep() {
    if (!this.fullName || !this.email || !this.password || !this.confirmPassword) { this.error = 'Fill all fields'; return; }
    if (this.password !== this.confirmPassword) { this.error = 'Passwords do not match'; return; }
    if (this.password.length < 6) { this.error = 'Password must be at least 6 characters'; return; }
    this.error = ''; this.step = 2;
  }

  onSubmit() {
    if (!this.phone || !this.gender || !this.dateOfBirth) { this.error = 'Fill all fields'; return; }
    this.loading = true; this.error = '';
    this.auth.register({
      fullName: this.fullName, email: this.email, password: this.password,
      phone: this.phone, gender: this.gender, dateOfBirth: this.dateOfBirth
    }).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/dashboard']); },
      error: (err) => {
        this.loading = false;
        // If email already exists, show a clear message and redirect to login
        if (err?.status === 409) {
          this.error = err?.error?.message || 'An account with this email already exists.';
          setTimeout(() => this.router.navigate(['/login']), 2000);
          return;
        }
        this.error = err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
