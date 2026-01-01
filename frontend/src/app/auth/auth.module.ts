import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }
];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes), LoginComponent, RegisterComponent],
  exports: [RouterModule]
})
export class AuthModule {}
