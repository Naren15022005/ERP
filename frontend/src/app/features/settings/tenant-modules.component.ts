import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleRegistryService } from '../../core/services/module-registry.service';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title">Módulos del tenant</h3>
        <p class="text-sm text-gray-500 mb-3">Activa o desactiva los módulos y ajusta su orden.</p>

        <div *ngFor="let m of catalog; let i = index" class="flex items-center gap-3 mb-2">
          <input type="checkbox" [(ngModel)]="m.enabled" id="mod-{{m.key}}" />
          <label for="mod-{{m.key}}" class="flex-1">{{ m.title }}</label>
          <input type="number" [(ngModel)]="m.display_order" class="input input-sm w-20" />
        </div>

        <div class="mt-4">
          <button class="btn btn-primary" (click)="save()">Guardar cambios</button>
        </div>
      </div>
    </div>
  `
})
export class TenantModulesSettingsComponent {
  private registry = inject(ModuleRegistryService);

  catalog: Array<{ key: string; title: string; enabled: boolean; display_order: number }> = [];

  constructor() {
    // initialize catalog from service's fallback list
    this.registry.modules$.subscribe(mods => {
      // Build a catalog where each known module is present; enabled default true if present in mods
      const keys = mods.map(m => m.key);
      this.catalog = (mods || []).map((m, idx) => ({ key: m.key, title: m.title, enabled: true, display_order: m.order ?? (idx + 1) }));
    });
  }

  save(): void {
    const payload = this.catalog.map(c => ({ module_key: c.key, enabled: !!c.enabled, display_order: Number(c.display_order) || null }));
    this.registry.saveModules(payload).subscribe({
      next: () => alert('Módulos actualizados.'),
      error: (e) => alert('Error al guardar módulos.'),
    });
  }
}
