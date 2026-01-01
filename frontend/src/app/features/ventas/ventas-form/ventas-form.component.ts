import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Sale } from '../../../core/models/sales';

@Component({
  selector: 'app-ventas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-4 border rounded bg-base-100">
      <h3 class="text-md font-semibold mb-2">{{ sale?.id ? 'Editar venta' : 'Nueva venta' }}</h3>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="label">Cliente</label>
            <input formControlName="customer_name" class="input input-sm w-full" />
          </div>
          <div>
            <label class="label">Estado</label>
            <select formControlName="status" class="select select-sm w-full">
              <option value="draft">Borrador</option>
              <option value="paid">Pagada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>

        <div class="mt-3">
          <div class="flex items-center justify-between">
            <label class="label">Items</label>
            <button type="button" class="btn btn-xs" (click)="addItem()">Añadir item</button>
          </div>

          <div formArrayName="items" class="space-y-2">
            <div *ngFor="let it of items.controls; let i = index" [formGroupName]="i" class="p-2 border rounded">
              <div class="grid grid-cols-4 gap-2">
                <input formControlName="product_name" placeholder="Producto" class="input input-sm col-span-2" />
                <input formControlName="quantity" type="number" class="input input-sm" />
                <input formControlName="price" type="number" class="input input-sm" />
              </div>
              <div class="flex justify-end mt-2">
                <button type="button" class="btn btn-ghost btn-sm" (click)="removeItem(i)">Quitar</button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <div>Total: <strong>{{ total | currency }}</strong></div>
          <div>
            <button type="button" class="btn btn-ghost mr-2" (click)="cancel.emit()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Guardar</button>
          </div>
        </div>
      </form>
    </div>
  `
})
export class VentasFormComponent implements OnChanges {
  @Input() sale: Sale | null = null;
  @Output() saved = new EventEmitter<Sale>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    customer_name: [''],
    status: ['draft', Validators.required],
    items: this.fb.array([])
  });

  get items() {
    return this.form.get('items') as FormArray;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sale']) {
      this.patchForm();
    }
  }

  patchForm() {
    this.items.clear();
    if (!this.sale) {
      this.form.patchValue({ customer_name: '', status: 'draft' });
      return;
    }

    this.form.patchValue({ customer_name: this.sale.customer_name || '', status: this.sale.status || 'draft' });
    (this.sale.items || []).forEach(it => {
      this.items.push(this.fb.group({
        product_name: [it.product_name || ''],
        quantity: [it.quantity || 1, Validators.min(1)],
        price: [it.price || 0, Validators.min(0)]
      }));
    });
  }

  addItem() {
    this.items.push(this.fb.group({ product_name: [''], quantity: [1, Validators.min(1)], price: [0, Validators.min(0)] }));
  }

  removeItem(i: number) {
    this.items.removeAt(i);
  }

  get total() {
    return this.items.controls.reduce((sum, g: any) => {
      const q = Number(g.get('quantity')!.value || 0);
      const p = Number(g.get('price')!.value || 0);
      return sum + q * p;
    }, 0);
  }

  submit() {
    if (this.form.invalid) return;
    const payload: Sale = {
      ...this.sale,
      customer_name: this.form.value.customer_name,
      status: this.form.value.status,
      total: this.total,
      items: this.form.value.items.map((it: any) => ({ product_name: it.product_name, quantity: Number(it.quantity), price: Number(it.price), total: Number(it.quantity) * Number(it.price) }))
    };

    this.saved.emit(payload);
  }
}
