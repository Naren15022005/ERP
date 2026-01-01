import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h2 class="text-xl font-semibold mb-4">Usuarios</h2>
      <p>Listado de usuarios (mock). En el futuro se consumirá: <code>/api/users</code></p>
      <table class="min-w-full bg-white shadow rounded mt-4">
        <thead>
          <tr class="text-left">
            <th class="px-4 py-2">ID</th>
            <th class="px-4 py-2">Nombre</th>
            <th class="px-4 py-2">Email</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of users" class="border-t">
            <td class="px-4 py-2">{{u.id}}</td>
            <td class="px-4 py-2">{{u.name}}</td>
            <td class="px-4 py-2">{{u.email}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class UsersListComponent {
  users = [
    { id: 1, name: 'Admin', email: 'admin@example.com' },
    { id: 2, name: 'Carlos', email: 'carlos@example.com' },
    { id: 3, name: 'Ana', email: 'ana@example.com' }
  ];
}
