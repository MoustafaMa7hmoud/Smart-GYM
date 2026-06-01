import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-forgot-password', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, Footer],
  templateUrl: './forgot-password.html', styleUrls: ['./forgot-password.css']
})
export class ForgotPassword {
  email = ''; loading = false; sent = false; error = '';

  onSubmit() {
    if (!this.email) { this.error = 'Please enter your email'; return; }
    this.loading = true; this.error = '';
    // When backend has forgot-password endpoint: call it here
    // For now simulate success after 1s
    setTimeout(() => {
      this.loading = false;
      this.sent = true;
    }, 1000);
  }
}
