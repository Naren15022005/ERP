import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { LoginPageComponent } from './pages/login.component';
import { RegisterPageComponent } from './pages/register.component';

const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), LoginPageComponent, RegisterPageComponent],
  exports: [RouterModule]
})
export class AuthModule {}
