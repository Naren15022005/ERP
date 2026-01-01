import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-base-100">
      <div class="card w-96 bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl font-bold text-center mb-4">Iniciar Sesión</h2>
          
          @if (errorMessage) {
            <div class="alert alert-error mb-4">
              <span>{{ errorMessage }}</span>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Email</span>
              </label>
              <input 
                type="email" 
                formControlName="email" 
                placeholder="correo@ejemplo.com" 
                class="input input-bordered w-full placeholder-gray-400 placeholder:text-gray-400 placeholder:opacity-40"
                [class.input-error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              />
              @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                <label class="label">
                  <span class="label-text-alt text-error">Email es requerido</span>
                </label>
              }
            </div>

            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Contraseña</span>
              </label>
              <input 
                type="password" 
                formControlName="password" 
                placeholder="••••••••" 
                class="input input-bordered w-full placeholder-gray-400 placeholder:text-gray-400 placeholder:opacity-40"
                [class.input-error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              />
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <label class="label">
                  <span class="label-text-alt text-error">Contraseña es requerida</span>
                </label>
              }
            </div>

            <div class="form-control mt-6">
              <button 
                type="submit" 
                class="btn btn-primary w-full"
                [disabled]="loginForm.invalid || loading"
              >
                @if (loading) {
                  <span class="loading loading-spinner"></span>
                }
                Ingresar
              </button>
            </div>

            <div class="divider"></div>

            <div class="text-center">
              <p class="text-sm">
                ¿No tienes cuenta?
                <a routerLink="/auth/register" class="link link-primary">Regístrate aquí</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  errorMessage = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const credentials = this.loginForm.value as { email: string; password: string };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading = false;
        // Get return URL from route parameters or default to '/dashboard'
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      }
    });
  }
}
