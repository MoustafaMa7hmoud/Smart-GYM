import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-login', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, Footer],
  templateUrl: './login.html', styleUrls: ['./login.css']
})
export class Login {
  private auth   = inject(AuthService);
  private router = inject(Router);
  email = ''; password = ''; loading = false; error = '';

  onSubmit() {
    if (!this.email || !this.password) { this.error = 'Please fill all fields'; return; }
    this.loading = true; this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        const role = res.data?.user?.role;
        if (role === 'admin') this.router.navigate(['/admin']);
        else if (role === 'trainer') this.router.navigate(['/trainer']);
        else this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Invalid email or password';
      }
    });
  }
}
