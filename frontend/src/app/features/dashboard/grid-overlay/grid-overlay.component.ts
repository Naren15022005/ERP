import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="absolute inset-0 pointer-events-none z-50">
      <div class="absolute inset-0" [ngStyle]="gridStyle"></div>
      <div *ngIf="highlight" class="absolute" [style.left.px]="highlight.x" [style.top.px]="highlight.y" [style.width.px]="highlight.width" [style.height.px]="highlight.height" [ngStyle]="highlightStyle"></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class GridOverlayComponent {
  @Input() visible = false;
  @Input() containerWidth = 1200;
  @Input() containerHeight = 800;
  @Input() cellSize = 40; // px
  @Input() highlight: { x: number; y: number; width: number; height: number } | null = null;

  get gridStyle() {
    const size = this.cellSize;
    return {
      'background-image': `linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)` ,
      'background-size': `${size}px ${size}px, ${size}px ${size}px`,
      'width.px': this.containerWidth,
      'height.px': this.containerHeight,
      'opacity': '0.9'
    } as any;
  }

  get highlightStyle() {
    return {
      'background': 'rgba(99,102,241,0.12)',
      'border': '2px dashed rgba(99,102,241,0.9)',
      'box-shadow': '0 6px 18px rgba(0,0,0,0.25)'
    } as any;
  }
}
