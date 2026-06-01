import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
export class Subscribe implements OnInit, OnDestroy {
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
  createdPaymentId: string | null = null;
  paymentWindow: Window | null = null;
  private pollingHandle: number | null = null;
  private readonly pollingIntervalMs = 4000;

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

    // Open the payment window immediately to avoid popup blockers.
    this.paymentWindow = window.open('about:blank', '_blank');

    // ✅ الباك بيتوقع بس: { plan: 'basic'|'standard'|'premium', durationMonths: number }
    // الـ startDate و endDate بيحسبهم الـ service تلقائياً — مش محتاجهم نبعتهم
    this.subApi.create({
      plan: this.selectedPlan.id,           // 'basic' | 'standard' | 'premium'
      durationMonths: this.selectedDuration // 1 | 3 | 6 | 12
    }).subscribe({
      next: (res) => {
        this.createdSub = res.data;
        const user = this.auth.currentUser as any;
        const extras = { userFullName: user?.fullName, userPhone: user?.phone };

        this.payApi.initiate(res.data._id, extras).subscribe({
          next: (payRes) => {
            this.loading = false;
            console.log('Payment initiation response:', JSON.stringify(payRes, null, 2));
            this.iframeUrl = payRes.data?.iframeUrl
                          || payRes.data?.payment?.iframeUrl
                          || payRes.data?.data?.iframe_url
                          || payRes.data?.data?.payment?.iframeUrl
                          || '';
            // Backend returns: { iframeUrl, paymentId, paymobOrderId, amountEGP }
            this.createdPaymentId = payRes.data?.paymentId
                                 || payRes.data?.payment?._id
                                 || payRes.data?.payment?.id
                                 || payRes.data?._id
                                 || null;

            if (this.iframeUrl) {
              this.step = 'paying';
              this.startPaymentPolling();
              if (this.paymentWindow && !this.paymentWindow.closed) {
                this.paymentWindow.location.href = this.iframeUrl;
              } else {
                window.open(this.iframeUrl, '_blank');
              }
            } else {
              this.error = 'Could not get payment URL. Please try again.';
              if (this.paymentWindow && !this.paymentWindow.closed) {
                this.paymentWindow.close();
              }
              this.paymentWindow = null;
            }
          },
          error: (err) => {
            this.loading = false;
            console.error('Payment initiation error:', err);
            const backendMsg = err?.error?.message || err?.error || null;
            this.error = backendMsg ? `Payment initiation failed: ${backendMsg}` : 'Payment initiation failed (server error). Please try again or contact support.';
            if (this.paymentWindow && !this.paymentWindow.closed) {
              this.paymentWindow.close();
            }
            this.paymentWindow = null;
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Could not create subscription. Please try again.';
        if (this.paymentWindow && !this.paymentWindow.closed) {
          this.paymentWindow.close();
        }
        this.paymentWindow = null;
      }
    });
  }

  ngOnDestroy() {
    this.stopPaymentPolling();
  }

  startPaymentPolling() {
    this.stopPaymentPolling();
    if (!this.createdSub?._id) { return; }
    this.checkPaymentStatus(true);
    this.pollingHandle = window.setInterval(() => {
      this.checkPaymentStatus(true);
    }, this.pollingIntervalMs);
  }

  stopPaymentPolling() {
    if (this.pollingHandle != null) {
      clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    }
  }

  cancelPayment() {
    this.step = 'confirm';
    this.error = '';
    this.stopPaymentPolling();
    if (this.paymentWindow && !this.paymentWindow.closed) {
      this.paymentWindow.close();
    }
    this.paymentWindow = null;
  }

  checkPaymentStatus(auto = false) {
    if (!this.createdSub?._id) return;

    // ── Poll /payments/my and find our payment by paymobOrderId or _id ──
    // This avoids the 403 from getById ownership check issues
    this.payApi.getMy(true).subscribe({
      next: (payments: any) => {
        // payments is an array from getMy (uses extractItems pipe)
        const arr: any[] = Array.isArray(payments) ? payments : (payments?.data ?? []);
        console.log('[Polling] payments/my response count:', arr.length,
          'createdPaymentId:', this.createdPaymentId,
          'createdSub._id:', this.createdSub?._id);
        if (arr.length > 0) {
          console.log('[Polling] first payment sample:', JSON.stringify({
            _id: arr[0]._id,
            status: arr[0].status,
            subscription: arr[0].subscription
          }));
        }
        // Find the payment matching our subscription
        const myPayment = arr.find((p: any) => {
          // subscription may be a populated object {_id, plan,...} or a raw ObjectId string
          const subId = p.subscription?._id ?? p.subscription;
          const matchBySub = String(subId) === String(this.createdSub?._id);
          const matchById  = String(p._id) === String(this.createdPaymentId);
          console.log('[Polling] payment', p._id, 'status:', p.status, 'subId:', String(subId), 'matchBySub:', matchBySub, 'matchById:', matchById);
          return matchBySub || matchById;
        });
        console.log('[Polling] myPayment found:', myPayment ? myPayment._id + ' status=' + myPayment.status : 'NOT FOUND');
        if (myPayment?.status === 'completed') {
          this.stopPaymentPolling();
          this.step = 'success';
          return;
        }
        // Also check subscription status as fallback
        this._checkSubscriptionStatus(auto);
      },
      error: () => {
        this._checkSubscriptionStatus(auto);
      }
    });
  }

  private _checkSubscriptionStatus(auto = false) {
    // After webhook fires, the subscription status becomes 'active'
    this.subApi.getMy(true).subscribe({
      next: (res) => {
        console.log('[Polling] subscriptions/my raw response:', JSON.stringify(res));
        const status = res.data?.status;
        const isPaid = status === 'active'
                    || status === 'success'
                    || status === 'paid'
                    || status === 'completed';
        if (isPaid) {
          this.stopPaymentPolling();
          this.step = 'success';
        } else if (!auto) {
          this.error = 'Payment not confirmed yet. Please complete the payment in the opened window, then click \"I\'ve Paid\" again.';
        }
      },
      error: () => {
        if (!auto) {
          this.error = 'Could not verify payment status. Please try again.';
        }
      }
    });
  }

  getDurationLabel(): string {
    return this.durations.find(d => d.months === this.selectedDuration)?.label || '';
  }

  getDiscount(): number {
    return this.durations.find(d => d.months === this.selectedDuration)?.discount || 0;
  }
}
