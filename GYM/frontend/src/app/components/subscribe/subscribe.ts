import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SubscriptionApiService, PaymentApiService } from '../../services/api.services';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-subscribe', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, Footer],
  templateUrl: './subscribe.html', styleUrls: ['./subscribe.css']
})
export class Subscribe implements OnInit {
  auth   = inject(AuthService);
  subApi = inject(SubscriptionApiService);
  payApi = inject(PaymentApiService);
  router = inject(Router);

  step: 'select' | 'duration' | 'confirm' | 'paying' | 'success' = 'select';
  selectedPlan: any = null;
  selectedDuration = 1;
  loading = false;
  error = '';
  iframeUrl = '';
  createdSub: any = null;

  // ── الـ plans هنا hardcoded بـ id = الـ string اللي الباك بيتوقعه ──────
  plans = [
    {
      id: 'basic', name: 'Basic', price: 199, color: '#888', recommended: false,
      features: ['Access to all workout plans', 'Progress tracking', 'Exercise library access', 'Community access']
    },
    {
      id: 'standard', name: 'Standard', price: 399, color: '#DAFF6E', recommended: true,
      features: ['All Basic features', 'Trainer assignment', 'Nutrition tips', 'Priority support', 'Custom goals']
    },
    {
      id: 'premium', name: 'Premium', price: 699, color: '#a78bfa', recommended: false,
      features: ['All Standard features', 'Personal trainer sessions', 'Custom workout plans', 'Diet consultation', 'Dedicated support']
    },
  ];

  durations = [
    { months: 1,  label: '1 Month',   discount: 0  },
    { months: 3,  label: '3 Months',  discount: 5  },
    { months: 6,  label: '6 Months',  discount: 10 },
    { months: 12, label: '12 Months', discount: 20 },
  ];

  ngOnInit() {
    if (!this.auth.isLoggedIn) { this.router.navigate(['/login']); }
  }

  selectPlan(plan: any) { this.selectedPlan = plan; this.step = 'duration'; }

  get totalPrice(): number {
    if (!this.selectedPlan) return 0;
    const dur = this.durations.find(d => d.months === this.selectedDuration)!;
    const base = this.selectedPlan.price * this.selectedDuration;
    return Math.round(base * (1 - dur.discount / 100));
  }

  get savingsAmount(): number {
    if (!this.selectedPlan) return 0;
    return (this.selectedPlan.price * this.selectedDuration) - this.totalPrice;
  }

  proceed() { this.step = 'confirm'; }

  confirmAndPay() {
    this.loading = true;
    this.error = '';

    // ✅ الباك بيتوقع بس: { plan: 'basic'|'standard'|'premium', durationMonths: number }
    // الـ startDate و endDate بيحسبهم الـ service تلقائياً — مش محتاجهم نبعتهم
    this.subApi.create({
      plan: this.selectedPlan.id,           // 'basic' | 'standard' | 'premium'
      durationMonths: this.selectedDuration // 1 | 3 | 6 | 12
    }).subscribe({
      next: (res) => {
        this.createdSub = res.data;
        // بعد ما الـ subscription اتعملت → ابدأ الدفع
        this.payApi.initiate(res.data._id).subscribe({
          next: (payRes) => {
            this.loading = false;
            // الـ backend بيرجع iframeUrl جوه data مباشرة أو جوه data.payment
            this.iframeUrl = payRes.data?.iframeUrl
                          || payRes.data?.payment?.iframeUrl
                          || '';
            if (this.iframeUrl) {
              this.step = 'paying';
              window.open(this.iframeUrl, '_blank');
            } else {
              this.error = 'Could not get payment URL. Please try again.';
            }
          },
          error: (err) => {
            this.loading = false;
            this.error = err?.error?.message || 'Payment initiation failed. Please try again.';
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Could not create subscription. Please try again.';
      }
    });
  }

  checkPaymentStatus() {
    if (!this.createdSub?._id) return;
    this.subApi.getById(this.createdSub._id).subscribe({
      next: (res) => {
        if (res.data?.status === 'active') {
          this.step = 'success';
        } else {
          this.error = 'Payment not confirmed yet. Please complete the payment in the opened window, then click "I\'ve Paid" again.';
        }
      },
      error: () => { this.error = 'Could not verify payment status. Please try again.'; }
    });
  }

  getDurationLabel(): string {
    return this.durations.find(d => d.months === this.selectedDuration)?.label || '';
  }

  getDiscount(): number {
    return this.durations.find(d => d.months === this.selectedDuration)?.discount || 0;
  }
}
