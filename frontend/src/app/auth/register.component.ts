import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-md mx-auto mt-8">
      <h2 class="text-xl font-semibold mb-4">Register</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <input formControlName="name" placeholder="Name" class="input input-bordered w-full mb-2" />
        <input formControlName="email" placeholder="Email" class="input input-bordered w-full mb-2" />
        <input formControlName="password" type="password" placeholder="Password" class="input input-bordered w-full mb-2" />
        <button class="btn btn-primary" type="submit">Register</button>
      </form>
    </div>
  `
})
export class RegisterComponent {
  form = this.fb.group({ name: ['', Validators.required], email: ['', Validators.required], password: ['', Validators.required] });
  constructor(private fb: FormBuilder) {}
  submit() { console.log('register', this.form.value); }
}

