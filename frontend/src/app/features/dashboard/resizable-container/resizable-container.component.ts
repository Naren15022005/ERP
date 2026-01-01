import { Component, Input, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, ViewChild, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ResizeData {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-resizable-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      #container
      [attr.data-element-id]="elementId"
      class="resizable-container"
      (mousedown)="onSelect($event)"
      [class.selected]="selectedId === elementId"
      [class.edit-mode]="editMode"
      [class.dragging]="isDragging"
      [class.resizing]="isResizing"
      [style.position]="'absolute'"
      [style.left.px]="currentX"
      [style.top.px]="currentY"
      [style.width.px]="currentWidth"
      [style.maxWidth.px]="currentWidth"
      [style.minWidth.px]="minWidth"
      [style.flex]="'0 0 ' + currentWidth + 'px'"
      [style.height.px]="currentHeight"
      [style.minHeight.px]="minHeight"
      [style.zIndex]="isDragging || isResizing ? 1000 : 1"
    >
      <!-- Drag handle -->
      @if (editMode) {
        <div 
          class="drag-handle"
          (mousedown)="startDrag($event)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>
      }
      
      <ng-content></ng-content>
      
      <!-- Resize handles -->
      @if (editMode) {
        <!-- Right edge -->
        <div 
          class="resize-handle resize-handle-e"
          (mousedown)="startResize($event, 'e')"
        ></div>
        
        <!-- Bottom edge -->
        <div 
          class="resize-handle resize-handle-s"
          (mousedown)="startResize($event, 's')"
        ></div>
        
        <!-- Bottom-right corner -->
        <div 
          class="resize-handle resize-handle-se"
          (mousedown)="startResize($event, 'se')"
        ></div>
        
        <!-- Top edge -->
        <div 
          class="resize-handle resize-handle-n"
          (mousedown)="startResize($event, 'n')"
        ></div>
        
        <!-- Left edge -->
        <div 
          class="resize-handle resize-handle-w"
          (mousedown)="startResize($event, 'w')"
        ></div>
        
        <!-- Size indicator -->
        <div class="size-indicator">
          {{ Math.round(currentWidth) }} × {{ Math.round(currentHeight) }}
        </div>
      }
    </div>
  `,
  styles: [`
    .resizable-container {
      box-sizing: border-box;
      transition: none !important;
      will-change: auto;
    }
    
    .resizable-container.edit-mode {
      user-select: none;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
      border-radius: 8px;
      cursor: default;
    }
    
    .resizable-container.selected {
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.6);
    }
    
    .resizable-container.dragging {
      opacity: 0.9;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      cursor: move !important;
      z-index: 9999 !important;
    }
    
    .resizable-container.dragging {
      opacity: 0.8;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      cursor: move !important;
    }
    
    .resizable-container.resizing {
      transition: none !important;
    }
    
    .drag-handle {
      position: absolute;
      top: 8px;
      left: 8px;
      width: 32px;
      height: 32px;
      background: rgba(99, 102, 241, 0.9);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: move;
      z-index: 20;
      color: white;
      transition: background 0.2s;
    }
    
    .drag-handle:hover {
      background: rgba(99, 102, 241, 1);
      transform: scale(1.05);
    }
    
    .resize-handle {
      position: absolute;
      background: rgba(99, 102, 241, 0.6);
      z-index: 15;
      transition: background 0.15s;
    }
    
    .resize-handle:hover {
      background: rgba(99, 102, 241, 0.9);
    }
    
    .resize-handle-e {
      right: -4px;
      top: 0;
      bottom: 0;
      width: 8px;
      cursor: ew-resize;
    }
    
    .resize-handle-w {
      left: -4px;
      top: 0;
      bottom: 0;
      width: 8px;
      cursor: ew-resize;
    }
    
    .resize-handle-n {
      top: -4px;
      left: 0;
      right: 0;
      height: 8px;
      cursor: ns-resize;
    }
    
    .resize-handle-s {
      bottom: -4px;
      left: 0;
      right: 0;
      height: 8px;
      cursor: ns-resize;
    }
    
    .resize-handle-se {
      bottom: -6px;
      right: -6px;
      width: 20px;
      height: 20px;
      cursor: nwse-resize;
      border-radius: 0 0 6px 0;
    }
    
    .size-indicator {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 10;
      font-family: monospace;
    }
  `]
})
export class ResizableContainerComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('container', { static: false }) containerEl!: ElementRef<HTMLElement>;
  @Input() elementId!: string;
  @Input() editMode = false;
  @Input() initialWidth?: number;
  @Input() initialHeight?: number;
  @Input() initialX?: number;
  @Input() initialY?: number;
  @Input() minWidth = 200;
  @Input() minHeight = 100;
  @Output() resized = new EventEmitter<ResizeData>();
  @Output() moved = new EventEmitter<ResizeData>();
  @Output() moving = new EventEmitter<ResizeData>();
  @Output() selected = new EventEmitter<string>();
  @Input() selectedId?: string;
  @Input() position?: { x: number; y: number } | null;
  @Input() containerWidth?: number | null;
  @Input() containerHeight?: number | null;
  @Input() containerPadding: number = 16;
  @Input() topPadding?: number | null = null;

  currentWidth = 0;
  currentHeight = 0;
  currentX = 0;
  currentY = 0;
  Math = Math;

  isResizing = false;
  isDragging = false;
  private resizeDirection: 'e' | 's' | 'se' | 'n' | 'w' | null = null;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private startPosX = 0;
  private startPosY = 0;
  private rafId: number | null = null;
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['position'] && this.position && !this.isDragging && !this.isResizing) {
      const pos = this.position as { x: number; y: number; width?: number; height?: number };
      // Apply external position updates (parent manages responsive scaling)
      this.currentX = pos.x ?? this.currentX;
      this.currentY = pos.y ?? this.currentY;
      if (pos.width !== undefined) this.currentWidth = pos.width;
      if (pos.height !== undefined) this.currentHeight = pos.height;
    }
  }

  ngOnInit(): void {
    // Initialize synchronously from inputs so component renders immediately
    if (this.initialWidth && this.initialHeight) {
      this.currentWidth = this.initialWidth;
      this.currentHeight = this.initialHeight;
    } else {
      // sensible defaults to avoid layout flash
      this.currentWidth = this.initialWidth ?? Math.max(this.minWidth, 400);
      this.currentHeight = this.initialHeight ?? Math.max(this.minHeight, 300);
    }

    this.currentX = this.initialX ?? 0;
    this.currentY = this.initialY ?? 0;
  }

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    // Attempt to measure real size once rendered; only override if measurement yields larger values
    try {
      const rect = this.containerEl?.nativeElement?.getBoundingClientRect?.();
      if (rect) {
        if (rect.width && rect.width > 0) this.currentWidth = rect.width;
        if (rect.height && rect.height > 0) this.currentHeight = rect.height;
      }
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  startDrag(event: MouseEvent): void {
    if (!this.editMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startPosX = this.currentX;
    this.startPosY = this.currentY;
    
    document.addEventListener('mousemove', this.onDragMove, { passive: false });
    document.addEventListener('mouseup', this.onDragEnd);
    
    document.body.style.cursor = 'move';
    document.body.style.userSelect = 'none';
  }

  private onDragMove = (event: MouseEvent): void => {
    if (!this.isDragging) return;
    
    event.preventDefault();
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
      this.rafId = requestAnimationFrame(() => {
        const deltaX = event.clientX - this.startX;
        const deltaY = event.clientY - this.startY;

        // Apply delta
        let nx = this.startPosX + deltaX;
        let ny = this.startPosY + deltaY;

        // Enforce container bounds if container size provided
        const padding = (typeof this.containerPadding === 'number') ? this.containerPadding : 16; // inner padding from container edges
        const cw = this.containerWidth ?? null;
        const ch = this.containerHeight ?? null;
        if (cw !== null && cw !== undefined) {
          // Allow moving to the very left grid edge (0), but prevent overflow on the right
          nx = Math.max(0, Math.min(nx, Math.max(0, cw - this.currentWidth)));
        } else {
          nx = Math.max(0, nx);
        }
        // Allow vertical placement below current container height while editing
        // so users can stack items below; only enforce a minimum top padding from top edge.
        const topPad = (typeof this.topPadding === 'number') ? this.topPadding : padding;
        ny = Math.max(topPad, ny);

        this.currentX = nx;
        this.currentY = ny;

        // emit live moving event for overlays/snap guides
        this.moving.emit({
          id: this.elementId,
          width: this.currentWidth,
          height: this.currentHeight,
          x: this.currentX,
          y: this.currentY
        });
      });
  };

  private onDragEnd = (): void => {
    if (this.isDragging) {
      // capture final position and emit moved before clearing dragging flag
      const data: ResizeData = {
        id: this.elementId,
        width: this.currentWidth,
        height: this.currentHeight,
        x: this.currentX,
        y: this.currentY
      };
      this.cleanup();
      this.moved.emit(data);
      this.isDragging = false;
    }
  };

  startResize(event: MouseEvent, direction: 'e' | 's' | 'se' | 'n' | 'w'): void {
    if (!this.editMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.isResizing = true;
    this.resizeDirection = direction;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = this.currentWidth;
    this.startHeight = this.currentHeight;
    this.startPosX = this.currentX;
    this.startPosY = this.currentY;
    
    document.addEventListener('mousemove', this.onResizeMove, { passive: false });
    document.addEventListener('mouseup', this.onResizeEnd);
    
    const cursorMap = {
      'e': 'ew-resize',
      'w': 'ew-resize',
      's': 'ns-resize',
      'n': 'ns-resize',
      'se': 'nwse-resize'
    };
    document.body.style.cursor = cursorMap[direction];
    document.body.style.userSelect = 'none';
  }

  private onResizeMove = (event: MouseEvent): void => {
    if (!this.isResizing || !this.resizeDirection) return;
    
    event.preventDefault();
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
      this.rafId = requestAnimationFrame(() => {
        const deltaX = event.clientX - this.startX;
        const deltaY = event.clientY - this.startY;

        const dir = this.resizeDirection!;

        // Enforce container bounds and minimums while resizing
        const padding = (typeof this.containerPadding === 'number') ? this.containerPadding : 16;
        const cw = this.containerWidth ?? null;
        const ch = this.containerHeight ?? null;

        if (dir === 'e' || dir === 'se') {
          let nw = Math.max(this.minWidth, this.startWidth + deltaX);
          if (cw !== null) nw = Math.min(nw, Math.max(this.minWidth, cw - this.startPosX));
          this.currentWidth = nw;
        }

        if (dir === 'w') {
          let newWidth = Math.max(this.minWidth, this.startWidth - deltaX);
          let newX = this.startPosX + deltaX;
          if (cw !== null) {
            // Allow resizing/moving to the leftmost grid edge (0)
            newX = Math.max(0, Math.min(newX, cw - newWidth));
          } else {
            newX = Math.max(0, newX);
          }
          this.currentWidth = newWidth;
          this.currentX = newX;
        }

        if (dir === 's' || dir === 'se') {
          // Allow expanding height beyond container height so user can make an element larger
          // and push container extents; only enforce minimum height.
          let nh = Math.max(this.minHeight, this.startHeight + deltaY);
          this.currentHeight = nh;
        }

        if (dir === 'n') {
          let newHeight = Math.max(this.minHeight, this.startHeight - deltaY);
          let newY = this.startPosY + deltaY;
          // Only enforce top padding; allow the element to move down/up as needed.
          const topPad2 = (typeof this.topPadding === 'number') ? this.topPadding : padding;
          newY = Math.max(topPad2, newY);
          this.currentHeight = newHeight;
          this.currentY = newY;
        }
      });
  };

  private onResizeEnd = (): void => {
    if (this.isResizing) {
      this.isResizing = false;
      this.resizeDirection = null;
      this.cleanup();
      this.emitChange();
    }
  };

  private cleanup(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onDragEnd);
    document.removeEventListener('mouseup', this.onResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  private emitChange(): void {
    const data: ResizeData = {
      id: this.elementId,
      width: this.currentWidth,
      height: this.currentHeight,
      x: this.currentX,
      y: this.currentY
    };
    
    if (this.isDragging) {
      this.moved.emit(data);
    } else {
      this.resized.emit(data);
    }
  }

  onSelect(event: MouseEvent): void {
    if (!this.editMode) return;
    event.stopPropagation();
    this.selected.emit(this.elementId);
  }
}
