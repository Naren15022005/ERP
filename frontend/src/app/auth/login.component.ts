import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-md mx-auto mt-8">
      <h2 class="text-xl font-semibold mb-4">Login</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <input formControlName="email" placeholder="Email" class="input input-bordered w-full mb-2" />
        <input formControlName="password" type="password" placeholder="Password" class="input input-bordered w-full mb-2" />
        <button class="btn btn-primary" type="submit">Login</button>
      </form>
    </div>
  `
})
export class LoginComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  form = this.fb.group({ email: ['', [Validators.required]], password: ['', [Validators.required]] });
  constructor(private fb: FormBuilder) {}

  submit() {
    if (this.form.invalid) return;
    const { email, password } = this.form.value;
    this.auth.login({ email, password } as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => alert(err?.error?.message || 'Login failed')
    });
  }
}

