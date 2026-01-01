import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// Custom validator for password confirmation
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const passwordConfirmation = control.get('password_confirmation');

  if (!password || !passwordConfirmation) {
    return null;
  }

  return password.value === passwordConfirmation.value ? null : { passwordMismatch: true };
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-base-100 flex items-center justify-center p-6">
      <div class="w-full max-w-2xl card bg-card text-gray-100 border border-transparent shadow-md rounded-xl overflow-hidden">
        <div class="card-body p-8">
          <div class="mb-4 text-center w-full">
            @if (errorMessage) {
              <div class="alert alert-error mb-2">
                <span>{{ errorMessage }}</span>
              </div>
            }
            <h2 class="text-2xl font-semibold mb-1 text-gray-100">Crear Cuenta</h2>
            <p class="text-sm text-gray-300">Registra tu empresa y elige los módulos que necesitas.</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="grid grid-cols-1 gap-3">
              <div>
                <label class="label text-sm"><span class="label-text">Nombre</span></label>
                <input type="text" formControlName="name" placeholder="Tu nombre completo" class="input input-bordered w-full bg-card text-gray-100 placeholder-gray-400 border-gray-700" [class.input-error]="registerForm.get('name')?.invalid && registerForm.get('name')?.touched" />
                @if (registerForm.get('name')?.invalid && registerForm.get('name')?.touched) {
                  <span class="text-xs text-error">Nombre es requerido</span>
                }
              </div>

              <div>
                <label class="label text-sm"><span class="label-text">Email</span></label>
                <input type="email" formControlName="email" placeholder="correo@ejemplo.com" class="input input-bordered w-full bg-card text-gray-100 placeholder-gray-400 border-gray-700" [class.input-error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched" />
                @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                  <span class="text-xs text-error">Email válido es requerido</span>
                }
              </div>

              <div>
                <label class="label text-sm"><span class="label-text">Nombre de la Empresa</span></label>
                <input type="text" formControlName="tenant_name" placeholder="Mi Empresa S.A." class="input input-bordered w-full bg-card text-gray-100 placeholder-gray-400 border-gray-700" [class.input-error]="registerForm.get('tenant_name')?.invalid && registerForm.get('tenant_name')?.touched" />
                @if (registerForm.get('tenant_name')?.invalid && registerForm.get('tenant_name')?.touched) {
                  <span class="text-xs text-error">Nombre de empresa es requerido</span>
                }
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label text-sm"><span class="label-text">Tipo de negocio</span></label>
                  <select formControlName="business_type" class="select select-bordered w-full bg-card text-gray-100 border-gray-700">
                    <option value="">Selecciona...</option>
                    <option *ngFor="let t of businessTypes" [value]="t.value">{{ t.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="label text-sm"><span class="label-text">Tamaño</span></label>
                  <select formControlName="size_category" class="select select-bordered w-full bg-card text-gray-100 border-gray-700">
                    <option value="microempresa">Microempresa</option>
                    <option value="pequena">Pequeña</option>
                    <option value="mediana">Mediana</option>
                    <option value="grande">Grande</option>
                    <option value="empresa">Empresa</option>
                    <option value="macroempresa">Macroempresa</option>
                    <option value="granempresa">Gran Empresa</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="label text-sm"><span class="label-text">Descripción (¿qué hace?)</span></label>
                <input type="text" formControlName="business_description" placeholder="Breve descripción" class="input input-bordered w-full bg-card text-gray-100 placeholder-gray-400 border-gray-700" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label text-sm"><span class="label-text">Usuarios</span></label>
                  <input type="number" formControlName="employees_count" placeholder="5" min="1" max="5" class="input input-bordered w-full bg-card text-gray-100 placeholder-gray-400 border-gray-700" (input)="onEmployeesInput($event)" (paste)="onEmployeesPaste($event)" />
                  @if (registerForm.get('employees_count')?.invalid && registerForm.get('employees_count')?.touched) {
                    <span class="text-xs text-error">El número debe estar entre 1 y 5</span>
                  }
                </div>
                <div>
                  <label class="label text-sm"><span class="label-text">Contraseña</span></label>
                  <input type="password" formControlName="password" placeholder="••••••••" class="input input-bordered w-full bg-card text-gray-100 placeholder-gray-400 border-gray-700" [class.input-error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched" />
                  @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                    <span class="text-xs text-error">Contraseña debe tener al menos 6 caracteres</span>
                  }
                </div>
              </div>

              <div>
                <label class="label text-sm"><span class="label-text">Confirmar Contraseña</span></label>
                <input type="password" formControlName="password_confirmation" placeholder="••••••••" class="input input-bordered w-full bg-card text-gray-100 placeholder-gray-400 border-gray-700" [class.input-error]="registerForm.get('password_confirmation')?.invalid && registerForm.get('password_confirmation')?.touched" />
                @if (registerForm.errors?.['passwordMismatch'] && registerForm.get('password_confirmation')?.touched) {
                  <span class="text-xs text-error">Las contraseñas no coinciden</span>
                }
              </div>

              <div>
                <label class="label text-sm"><span class="label-text">¿Qué necesita tu negocio? (Selecciona módulos)</span></label>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                  <label *ngFor="let m of moduleOptions" class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm group transition-colors focus-within:ring-0" [ngClass]="isModuleSelected(m.key) ? 'bg-white/90 border-transparent shadow-[0_0_12px_rgba(255,255,255,0.06)]' : 'bg-card border-gray-700 text-gray-100'">
                    <input type="checkbox" class="sr-only peer" [checked]="isModuleSelected(m.key)" (change)="toggleModule(m.key)" />
                    <span class="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 border border-transparent bg-transparent">
                      <svg class="w-3 h-3 text-gray-900 opacity-0 transition-opacity duration-150" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    <span class="truncate" [style.color]="isModuleSelected(m.key) ? 'var(--bg-card)' : null">{{ m.title }}</span>
                  </label>
                </div>
                <p class="text-xs text-gray-400 mt-2">Se incluyen por defecto: Dashboard, Roles y Usuarios.</p>
              </div>

              <div class="mt-4 flex justify-end w-full">
                <button type="submit" class="btn px-6 bg-white text-gray-900 font-semibold disabled:opacity-60 disabled:cursor-not-allowed" [disabled]="registerForm.invalid || loading">
                  @if (loading) {
                    <span class="loading loading-spinner"></span>
                  }
                  Registrarse
                </button>
              </div>
            </div>

            <div class="divider my-4"></div>

            <div class="text-center">
              <p class="text-sm">¿Ya tienes cuenta? <a routerLink="/auth/login" class="link link-primary">Inicia sesión aquí</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RegisterPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = false;
  errorMessage = '';

  registerForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    tenant_name: ['', [Validators.required]],
    business_type: [''],
    business_description: [''],
    employees_count: [null, [Validators.min(1), Validators.max(5)]],
    size_category: ['pequena'],
    modules: [[]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    password_confirmation: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });

  businessTypes = [
    { value: 'tiendas-de-barrio', label: 'Tiendas de barrio' },
    { value: 'minimercados', label: 'Minimercados' },
    { value: 'superettes', label: 'Superettes' },
    { value: 'droguerias', label: 'Droguerías' },
    { value: 'ferreterias', label: 'Ferreterías' },
    { value: 'papelerias', label: 'Papelerías' },
    { value: 'licoreras', label: 'Licoreras' },
    { value: 'tiendas-de-ropa', label: 'Tiendas de ropa' },
    { value: 'tiendas-de-celulares', label: 'Tiendas de celulares' },
    { value: 'restaurantes', label: 'Restaurantes' },
    { value: 'cafeterias', label: 'Cafeterías' },
    { value: 'panaderias', label: 'Panaderías' },
    { value: 'pizzerias', label: 'Pizzerías' },
    { value: 'comidas-rapidas', label: 'Comidas rápidas' },
    { value: 'heladerias', label: 'Heladerías' },
    { value: 'eccomerce', label: 'E-commerce' },
  ];

  moduleOptions = [
    { key: 'ventas', title: 'Ventas' },
    { key: 'caja', title: 'Caja Diaria' },
    { key: 'products', title: 'Productos' },
    { key: 'purchases', title: 'Compras' },
    { key: 'suppliers', title: 'Proveedores' },
    // 'ingresos' and 'egresos' removed from registration options
    { key: 'reportes', title: 'Reportes' },
    // 'accounting' removed per request
  ];

  isModuleSelected(key: string): boolean {
    const current = this.registerForm.get('modules')?.value || [];
    return current.includes(key);
  }

  toggleModule(key: string): void {
    const control = this.registerForm.get('modules');
    if (!control) return;
    const current: string[] = control.value || [];
    const idx = current.indexOf(key);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(key);
    }
    (control as any).setValue([...current]);
    control.markAsDirty();
  }

  onEmployeesInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    if (!el) return;
    const raw = el.value;
    // allow empty
    if (raw === '') {
      (this.registerForm.get('employees_count') as any)?.setValue(null);
      return;
    }
    const v = parseInt(raw, 10);
    if (isNaN(v)) {
      (this.registerForm.get('employees_count') as any)?.setValue(null);
      return;
    }
    if (v > 5) {
      // Prevent values greater than 5: clamp the input to 5
      el.value = '5';
      (this.registerForm.get('employees_count') as any)?.setValue(5);
    } else if (v < 1) {
      el.value = '1';
      (this.registerForm.get('employees_count') as any)?.setValue(1);
    } else {
      (this.registerForm.get('employees_count') as any)?.setValue(v);
    }
  }

  onEmployeesPaste(event: ClipboardEvent): void {
    const paste = event.clipboardData?.getData('text') ?? '';
    const v = parseInt(paste, 10);
    if (!isNaN(v) && v > 5) {
      // block paste of numbers > 5
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      if (input) {
        input.value = '5';
        (this.registerForm.get('employees_count') as any)?.setValue(5);
      }
    }
  }



  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formData = this.registerForm.value as any;

    // Ensure mandatory default modules are always included
    const mandatory = ['dashboard', 'roles', 'users'];
    formData.modules = Array.isArray(formData.modules) ? formData.modules : [];
    for (const m of mandatory) {
      if (!formData.modules.includes(m)) {
        formData.modules.push(m);
      }
    }

    this.authService.register(formData).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al registrarse. Intenta nuevamente.';
        // Handle validation errors
        if (error.error?.errors) {
          const errors = Object.values(error.error.errors).flat();
          this.errorMessage = errors.join(' ');
        }
      }
    });
  }
}
