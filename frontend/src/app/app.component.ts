import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from './core/services/auth.service';
import { ModuleRegistryService, ModuleManifest } from './core/services/module-registry.service';
import { AlertService } from './core/services/alert.service';
import { Observable, combineLatest } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { InventoryService } from './features/inventory/inventory.service';
import { InventoryCacheService } from './features/inventory/inventory-cache.service';
import { ProductService } from './core/services/product.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmDialogComponent],
  template: `
    <div class="min-h-screen bg-base-100">
      <ng-container *ngIf="isAuthenticated; else publicRoutes">
        <div class="flex">
          <!-- Sidebar -->
          <aside [class]="sidebarOpen ? 'w-64' : 'w-16'" class="bg-base-100 shadow fixed left-0 top-0 bottom-0 transition-all duration-400 ease-out flex flex-col overflow-hidden z-40" style="will-change: width, transform, opacity;">
              <div *ngIf="sidebarOpen" class="p-2 flex items-center gap-2 justify-start">
              <button class="btn btn-ghost btn-square w-10 h-10 p-0 flex items-center justify-center text-gray-300 hover:bg-base-300 hover:text-white rounded-md" (click)="toggleSidebar()" aria-label="Toggle sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </button>
              <div class="normal-case text-base font-semibold text-gray-100 tracking-wide ml-1 truncate max-w-[11rem]" title="{{ getTenantName() }}">{{ getTenantName() || currentUser?.name || 'ERP Modular' }}</div>
            </div>

            <div *ngIf="!sidebarOpen" class="p-4 flex items-center justify-center">
              <button class="btn btn-ghost btn-square w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white" (click)="toggleSidebar()" aria-label="Toggle sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </button>
            </div>

            <nav class="p-2 flex-1">
              <ul *ngIf="sidebarOpen" class="flex flex-col gap-1 p-2 mt-1 transition-all duration-400 ease-out" style="transform-origin: left;">
                <li *ngFor="let m of modules$ | async">
                  <a [routerLink]="m.route" routerLinkActive="bg-base-300 text-white" class="flex items-center gap-3 px-3 py-2 h-10 rounded-md text-gray-300 hover:bg-base-300 hover:text-white">
                    <ng-container *ngIf="getSvg(m) as svgHtml">
                      <span class="inline-block h-5 w-5 text-gray-300" [innerHTML]="svgHtml"></span>
                    </ng-container>
                    <ng-container *ngIf="!getSvg(m)" [ngSwitch]="m.key">
                      <svg *ngSwitchCase="'dashboard'" xmlns="http://www.w3.org/2000/svg" class="inline-block h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a1 1 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13m7 7v-5h4v5zm2-15.586l6 6V15l.001 5H16v-5c0-1.103-.897-2-2-2h-4c-1.103 0-2 .897-2 2v5H6v-9.586z"/>
                      </svg>
                      <svg *ngSwitchCase="'users'" xmlns="http://www.w3.org/2000/svg" class="inline-block h-5 w-5 text-gray-300" viewBox="0 0 1024 1024" aria-hidden="true" fill="currentColor">
                        <path d="M512 512a192 192 0 1 0 0-384a192 192 0 0 0 0 384m0 64a256 256 0 1 1 0-512a256 256 0 0 1 0 512m320 320v-96a96 96 0 0 0-96-96H288a96 96 0 0 0-96 96v96a32 32 0 1 1-64 0v-96a160 160 0 0 1 160-160h448a160 160 0 0 1 160 160v96a32 32 0 1 1-64 0"/>
                      </svg>
                      <svg *ngSwitchDefault xmlns="http://www.w3.org/2000/svg" class="inline-block h-5 w-5 text-gray-300" viewBox="0 0 2048 2048" aria-hidden="true">
                        <path fill="currentColor" d="m960 120l832 416v1040l-832 415l-832-415V536zm625 456L960 264L719 384l621 314zM960 888l238-118l-622-314l-241 120zM256 680v816l640 320v-816zm768 1136l640-320V680l-640 320z"/>
                      </svg>
                    </ng-container>
                    <span class="inline-block transition-transform transition-opacity duration-400 ease-out" [ngClass]="{ 'translate-x-0 opacity-100': sidebarOpen, '-translate-x-2 opacity-0': !sidebarOpen }">{{ m.title }}</span>
                    <ng-container *ngIf="(alertsCount$ | async) as _c">
                      <span *ngIf="_c > 0" class="ml-auto inline-flex items-center justify-center w-6 h-6 text-[11px] font-semibold text-white bg-red-500 rounded-full">{{ _c > 9 ? '9+' : _c }}</span>
                    </ng-container>
                    <ng-container *ngIf="(alertsCount$ | async) as _c">
                      <span *ngIf="_c > 0" class="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-semibold text-white bg-red-500 rounded-full">{{ _c > 9 ? '9+' : _c }}</span>
                    </ng-container>
                  </a>
                </li>
              </ul>

              <!-- Collapsed icon-only menu (driven by ModuleRegistryService) -->
              <ul *ngIf="!sidebarOpen" class="flex flex-col items-center gap-3 py-4 transition-all duration-400 ease-out" style="transform-origin: center;">
                <li *ngFor="let m of modules$ | async">
                  <a [routerLink]="m.route" routerLinkActive="active" class="group relative btn btn-ghost btn-square w-12 h-12 flex items-center justify-center" aria-label="{{m.title}}" (mouseenter)="showTooltip($event, m)" (mouseleave)="hideTooltip()">
                    <ng-container *ngIf="getSvg(m) as svgHtml">
                      <span class="h-5 w-5 text-gray-400" [innerHTML]="svgHtml"></span>
                    </ng-container>
                    <ng-container *ngIf="!getSvg(m)" [ngSwitch]="m.key">
                      <svg *ngSwitchCase="'dashboard'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a1 1 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13m7 7v-5h4v5zm2-15.586l6 6V15l.001 5H16v-5c0-1.103-.897-2-2-2h-4c-1.103 0-2 .897-2 2v5H6v-9.586z"/>
                      </svg>
                      <svg *ngSwitchCase="'users'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 1024 1024" aria-hidden="true" fill="currentColor">
                        <path d="M512 512a192 192 0 1 0 0-384a192 192 0 0 0 0 384m0 64a256 256 0 1 1 0-512a256 256 0 0 1 0 512m320 320v-96a96 96 0 0 0-96-96H288a96 96 0 0 0-96 96v96a32 32 0 1 1-64 0v-96a160 160 0 0 1 160-160h448a160 160 0 0 1 160 160v96a32 32 0 1 1-64 0"/>
                      </svg>
                      <svg *ngSwitchDefault xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 2048 2048" aria-hidden="true">
                        <path fill="currentColor" d="m960 120l832 416v1040l-832 415l-832-415V536zm625 456L960 264L719 384l621 314zM960 888l238-118l-622-314l-241 120zM256 680v816l640 320v-816zm768 1136l640-320V680l-640 320z"/>
                      </svg>
                    </ng-container>
                  </a>
                </li>
              </ul>
            </nav>

            <div class="px-2 py-3 absolute left-0 right-0 w-full" style="bottom: -8px;">
              <div *ngIf="sidebarOpen" id="user-area" class="mb-2 px-2 py-2 hover:bg-white/5 rounded-md transition-colors" (click)="toggleLogout()" style="cursor: pointer;">
                <div class="flex items-center gap-2">
                  <div class="avatar">
                    <div class="rounded-full w-5 h-5 relative overflow-hidden" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
                      <span class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] leading-none select-none pointer-events-none text-white font-normal">{{ getUserInitials() }}</span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0 flex flex-col justify-center items-start">
                    <div class="font-semibold text-white text-xs w-full truncate overflow-hidden">{{ currentUser?.name }}</div>
                    <div class="text-[10px] text-gray-400 w-full truncate overflow-hidden">{{ getUserPlan() }}</div>
                  </div>
                  <button class="ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-md border border-white/30 text-white bg-transparent hover:bg-white/5 transition-colors" (click)="$event.stopPropagation(); openUpgrade()">MEJORAR</button>
                </div>
              </div>

              <!-- Logout: full width when open, icon-only when collapsed -->
              <div *ngIf="!sidebarOpen" id="user-area" class="flex justify-center items-center mb-3 relative cursor-pointer px-2 py-2 hover:bg-white/5 rounded-md transition-colors" (click)="toggleLogout()" (mouseenter)="showTooltip($event, $any({ title: currentUser?.name || 'Usuario', key: 'user', route: '/' }))" (mouseleave)="hideTooltip()">
                  <!-- Collapsed footer: only avatar -->
                  <div class="avatar">
                    <div class="rounded-full w-5 h-5 relative overflow-hidden" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
                      <span class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-normal leading-none select-none pointer-events-none text-white">{{ getUserInitials() }}</span>
                    </div>
                  </div>

                  <!-- small popup for logout when collapsed and toggled -->
                  <div *ngIf="showLogoutAction && !sidebarOpen" class="absolute bottom-14 left-0 w-64 bg-[#232426] text-gray-200 rounded-2xl shadow-2xl overflow-hidden border border-neutral-700" (click)="$event.stopPropagation()">
                    <!-- Header -->
                    <div class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div class="avatar flex-shrink-0">
                          <div class="rounded-full w-8 h-8 relative overflow-hidden" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
                            <span class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[12px] font-normal leading-none select-none pointer-events-none text-white">{{ getUserInitials() }}</span>
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-semibold text-white text-sm truncate">{{ currentUser?.name }}</div>
                          <div class="text-xs text-gray-400 truncate">@{{ currentUser?.email?.split('@')[0] || 'usuario' }}</div>
                        </div>
                      </div>
                    </div>

                    <div class="h-px bg-white/40 mx-3 rounded"></div>

                    <!-- Menu items -->
                    <div class="py-1">
                      <button class="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/3 transition-colors" (click)="changePlan()">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <span>Cambiar a un plan superior</span>
                      </button>

                      <button class="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/3 transition-colors" (click)="goToPersonalization()">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                        <span>Personalización</span>
                      </button>

                      <button class="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/3 transition-colors" (click)="goToSettings()">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m5.3-13.3l-4.2 4.2m-2.2 2.2l-4.2 4.2M23 12h-6m-6 0H1m18.3 5.3l-4.2-4.2m-2.2-2.2l-4.2-4.2"/></svg>
                        <span>Configuración</span>
                      </button>

                      <button class="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/3 transition-colors" (click)="goToHelp()">
                        <div class="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          <span>Ayuda</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>

                      <button class="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/3 transition-colors" (click)="$event.stopPropagation(); logout()">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        <span>Cerrar sesión</span>
                      </button>
                    </div>

                    <div class="h-px bg-white/40 mx-3 rounded"></div>

                    <!-- Footer (compact) -->
                    <div class="px-2 py-3 flex items-center justify-between gap-2 bg-transparent hover:bg-white/5 rounded-md transition-colors w-full">
                        <div class="flex items-center gap-2 min-w-0">
                          <div class="avatar flex-shrink-0">
                            <div class="rounded-full w-6 h-6 relative overflow-hidden" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
                              <span class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[12px] leading-none select-none pointer-events-none text-white font-normal">{{ getUserInitials() }}</span>
                            </div>
                          </div>
                          <div class="flex-1 min-w-0 flex flex-col justify-center items-start">
                            <div class="text-xs font-medium text-white w-full truncate overflow-hidden">{{ currentUser?.name }}</div>
                            <div class="text-xs text-gray-400 w-full truncate overflow-hidden">{{ getUserPlan() }}</div>
                          </div>
                        </div>
                      <button class="px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded-md border border-white/30 text-white bg-transparent hover:bg-white/5 transition-colors" (click)="$event.stopPropagation(); openUpgrade()">Mejorar</button>
                    </div>
                  </div>
              </div>

              <div *ngIf="sidebarOpen && showLogoutAction" class="absolute left-3 right-3 bottom-24 z-50 flex justify-center" (click)="$event.stopPropagation()">
                <div class="bg-base-100 border border-base-300 rounded-2xl shadow p-4 w-full max-w-sm">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="avatar">
                      <div class="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center">{{ getUserInitials() }}</div>
                    </div>
                    <div class="min-w-0">
                      <div class="font-semibold text-gray-200 truncate">{{ currentUser?.name }}</div>
                      <div class="text-xs text-gray-400 truncate">{{ currentUser?.name?.split(' ')[0] || 'usuario' }}</div>
                    </div>
                  </div>
                  <hr class="my-2 border-base-300" />
                  <ul class="text-sm space-y-3">
                    <li><button class="flex items-center gap-3 w-full text-left" (click)="changePlan()"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.344l1.172-1.172a4 4 0 115.656 5.656L10 18.828l-6.828-6.829a4 4 0 010-5.657z"/></svg> Cambiar a un plan superior</button></li>
                    <li><button class="flex items-center gap-3 w-full text-left" (click)="goToPersonalization()"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a1 1 0 011 1v1.07a7.002 7.002 0 012.374 1.362l.758-.758a1 1 0 011.414 1.414l-.758.758A7.002 7.002 0 0120.93 11H22a1 1 0 110 2h-1.07a7.002 7.002 0 01-1.362 2.374l.758.758a1 1 0 11-1.414 1.414l-.758-.758A7.002 7.002 0 0113 20.93V22a1 1 0 11-2 0v-1.07a7.002 7.002 0 01-2.374-1.362l-.758.758a1 1 0 11-1.414-1.414l.758-.758A7.002 7.002 0 0111 4.07V3a1 1 0 011-1z"/></svg> Personalización</button></li>
                    <li><button class="flex items-center gap-3 w-full text-left" (click)="goToSettings()"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8a4 4 0 100 8 4 4 0 000-8z"/><path d="M19.4 15a1.7 1.7 0 00.33 1.86l.06.06a1 1 0 01-1.41 1.41l-.06-.06a1.7 1.7 0 00-1.86-.33 1.7 1.7 0 00-1 .86l-.02.05a1 1 0 01-1.71.04l-.02-.05a1.7 1.7 0 00-1-.86 1.7 1.7 0 00-1.86.33l-.06.06a1 1 0 01-1.41-1.41l.06-.06a1.7 1.7 0 00.33-1.86 1.7 1.7 0 00-.86-1l-.05-.02a1 1 0 01-.04-1.71l.05-.02a1.7 1.7 0 00.86-1 1.7 1.7 0 00-1.86.33l-.06-.06A1 1 0 015.2 4.21l.06.06a1.7 1.7 0 001.86.33l.05-.02a1 1 0 01.99.17l.02.02a1 1 0 001 .86 1.7 1.7 0 001.86-.33l.06-.06A1 1 0 0113.79 6.2l-.06.06a1 1 0 00-.33 1.86 1.7 1.7 0 00.86 1l.02.05a1 1 0 01-.17.99l-.02.02a1.7 1.7 0 00-1 .86 1.7 1.7 0 00.33 1.86l.06.06a1 1 0 01-1.41 1.41l-.06-.06a1 1 0 00-1.86-.33 1.7 1.7 0 00-1 .86l-.02.05a1 1 0 01-1.71.04l-.02-.05a1.7 1.7 0 00-.86-1 1.7 1.7 0 00-1.86.33l-.06.06A1 1 0 014.21 18.8l.06-.06a1 1 0 001.86-.33l.02-.05a1 1 0 01.99-.17l.02.02a1 1 0 001 .86 1.7 1.7 0 001.86-.33l.06-.06A1 1 0 0113.79 17.8l-.06.06a1 1 0 00.33 1.86l.06.06A1 1 0 0115.2 20.79l-.06-.06a1 1 0 00-1.86-.33l-.05.02a1 1 0 01-.99-.17l-.02-.02a1 1 0 00-1-.86 1.7 1.7 0 00-1.86.33l-.06.06A1 1 0 014.21 21.79l.06-.06"/></svg> Configuración</button></li>
                  </ul>
                  <hr class="my-2 border-base-300" />
                  <div class="flex items-center justify-between">
                    <button class="flex items-center gap-2 text-sm" (click)="goToHelp()">Ayuda <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM9 13a1 1 0 002 0v-1a1 1 0 10-2 0v1z" clip-rule="evenodd"/></svg></button>
                    <button class="text-sm" (click)="$event.stopPropagation(); logout()">Cerrar sesión</button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <!-- Main content -->
          <main class="relative w-full p-4 h-screen overflow-auto" [style.marginLeft.px]="sidebarOpen ? 256 : 64">
            <!-- Top-right avatar removed as requested -->
            <router-outlet></router-outlet>
          </main>
          
          <!-- Upgrade modal -->
          <div *ngIf="showUpgradeModal" class="fixed inset-0 z-50 flex items-center justify-center">
            <div class="absolute inset-0 bg-black/50" (click)="closeUpgrade()"></div>
            <div class="bg-base-100 rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 relative z-10">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold">Mejorar plan</h3>
                <button class="btn btn-ghost btn-sm" (click)="closeUpgrade()">Cerrar</button>
              </div>

              <div class="space-y-4">
                <p class="text-sm text-gray-600">Aquí puedes mostrar opciones de planes, beneficios y enlaces para actualizar el plan de la cuenta. Este es un placeholder que puedes conectar con el flujo de pagos o la página de administración.</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div class="p-4 border rounded">
                    <div class="font-semibold">Plan Gratis</div>
                    <div class="text-sm text-gray-500">Limitado</div>
                    <div class="mt-3"><button class="btn btn-sm btn-outline w-full">Seleccionar</button></div>
                  </div>
                  <div class="p-4 border rounded">
                    <div class="font-semibold">Plan Pro</div>
                    <div class="text-sm text-gray-500">Más ventas, reportes</div>
                    <div class="mt-3"><button class="btn btn-sm btn-primary w-full">Actualizar</button></div>
                  </div>
                  <div class="p-4 border rounded">
                    <div class="font-semibold">Enterprise</div>
                    <div class="text-sm text-gray-500">Soporte dedicado</div>
                    <div class="mt-3"><button class="btn btn-sm btn-outline w-full">Contactar</button></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
      <ng-template #publicRoutes>
        <!-- Public routes (auth pages) -->
        <router-outlet></router-outlet>
      </ng-template>
    
      <!-- Global confirm dialog (centered) -->
      <app-confirm-dialog></app-confirm-dialog>
    </div>
  `
})
export class AppComponent {
  private authService = inject(AuthService);
  private moduleRegistry = inject(ModuleRegistryService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private inventoryService = inject(InventoryService);
  private inventoryCache = inject(InventoryCacheService);
  private productService = inject(ProductService);
  
  currentUser: User | null = null;
  isAuthenticated = false;
  sidebarOpen = true;
  modules: ModuleManifest[] = [];
  modules$!: Observable<ModuleManifest[]>;
  alertsCount$ = this.alertService.count$;
  tooltipTitle: string | null = null;
  tooltipX = 0;
  tooltipY = 0;
  private tooltipEl: HTMLElement | null = null;
  showUpgradeModal = false;
  showLogoutAction = false;
  logoutInProgress = false;

  // Document click handler to close the user menu when clicking outside
  private handleDocumentClick = (evt: Event) => {
    const el = document.getElementById('user-area');
    if (!el) return;
    const path = (evt as any).composedPath ? (evt as any).composedPath() : (evt as any).path || [];
    if (path.includes(el)) return;
    this.showLogoutAction = false;
  };

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  getSvg(m: ModuleManifest): SafeHtml | null {
    const anyM = m as any;
    if (anyM?.iconSvg) {
      // Normalize SVG: remove explicit width/height so CSS can size it
      let svg = anyM.iconSvg as string;
      // remove width/height attributes
      svg = svg.replace(/\s(width|height)=("[^"]*"|'[^']*')/gi, '');
      // ensure svg has width/height set to 100% so it fills container
      svg = svg.replace(/<svg/gi, '<svg width="100%" height="100%"');
      return this.sanitizer.bypassSecurityTrustHtml(svg);
    }
    return null;
  }

  ngOnInit(): void {
    // DEV ONLY: Force-inject debug token on every reload (overwrites old/invalid tokens)
    const debugToken = '17|Rsxg4JzTjuuVUEDHaRu9gsZvjgiy5Eky7QktohxE3db27cca';
    const currentToken = localStorage.getItem('token');
    if (currentToken !== debugToken) {
      localStorage.setItem('token', debugToken);
      console.warn('[DEV] Token actualizado automáticamente. Token válido para tenant_id=48.');
    }

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
      // debug: log currentUser to help diagnose header missing tenant name
      // eslint-disable-next-line no-console
      console.log('[AppComponent] currentUser', user, 'tenantName:', this.getTenantName());
    });
    
    // Refresh user data to ensure we have the latest tenant info
    if (this.authService.isAuthenticated) {
      this.authService.me().subscribe({
        error: (err) => console.error('Failed to refresh user data:', err)
      });
    }
    
    // Combine currentUser and modules streams to filter based on tenant config
    this.modules$ = combineLatest([
      this.authService.currentUser$,
      this.moduleRegistry.modules$.pipe(
        filter((mods): mods is ModuleManifest[] => mods !== null)
      )
    ]).pipe(
      map(([user, mods]) => {
        // Determine mandatory modules based on tenant config
        const isSingleUser = user?.tenant?.config?.employees_count === 1;
        const mandatoryKeys = isSingleUser ? ['dashboard', 'alerts'] : ['dashboard', 'roles', 'users', 'alerts'];
        
        const list = (mods || []).slice();
        const existingKeys = new Set(list.map(m => m.key));
        for (const k of mandatoryKeys) {
          if (!existingKeys.has(k)) {
            let title = k.charAt(0).toUpperCase() + k.slice(1);
            if (k === 'users') title = 'Usuarios';
            if (k === 'dashboard') title = 'Dashboard';
            if (k === 'roles') title = 'Roles';
            if (k === 'alerts') title = 'Alertas';
            list.unshift({ key: k, title, route: '/' + k });
          }
        }
        const seen = new Set<string>();
        const filtered = list.filter(m => {
          if (seen.has(m.key)) return false;
          seen.add(m.key);
          return true;
        }).sort((a, b) => (a.order || 999) - (b.order || 999));

        // Ensure alerts module has a proper icon SVG
        for (const m of filtered) {
          if (m.key === 'alerts') {
            (m as any).iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g fill="none" stroke="currentColor"><circle cx="7.5" cy="8.5" r="7"/><path stroke-linecap="round" d="M7.5 4.5V9"/></g><circle cx="7.5" cy="12" r="1" fill="currentColor"/></svg>`;
          }
        }

        // UI-level guarantee: move `inventory` to appear immediately after `products`.
        const prodIdx = filtered.findIndex(f => f.key === 'products');
        const invIdx = filtered.findIndex(f => f.key === 'inventory');
        if (prodIdx !== -1 && invIdx !== -1 && invIdx !== prodIdx + 1) {
          const [inv] = filtered.splice(invIdx, 1);
          const newProdIdx = filtered.findIndex(f => f.key === 'products');
          filtered.splice(newProdIdx + 1, 0, inv);
        }

        return filtered;
      }),
      // debug log when modules pipeline emits
      map(result => {
        console.log('[AppComponent] modules updated:', result);
        return result;
      })
    );

    // Close user menu when clicking outside
    document.addEventListener('click', this.handleDocumentClick);

    // Warm the inventory stock cache in background (centralized via InventoryCacheService)
    try {
      const ts = parseInt(localStorage.getItem('inventory_stock_cache_ts') || '0', 10) || 0;
      const age = Date.now() - ts;
      const fiveMin = 5 * 60 * 1000;
      if (age > fiveMin) {
        this.inventoryCache.refresh({ page: 1, per_page: 50 });
      }
    } catch (e) { /* ignore */ }

    // If we have a token but no current user (e.g. after a hard reload), try to rehydrate
    try {
      const token = localStorage.getItem('token');
      if (token && !this.authService.currentUserValue) {
        this.authService.me().subscribe({
          next: () => {
            console.log('[AppComponent] rehydrated currentUser from token');
          },
          error: (err) => {
            console.warn('[AppComponent] failed to rehydrate user from token', err);
            try { localStorage.removeItem('token'); } catch (e) {}
          }
        });
      }
    } catch (e) {
      // ignore
    }

    // Warm a lightweight products cache in background so Products view can render instantly
    try {
      const tsP = parseInt(localStorage.getItem('products_cache_ts') || '0', 10) || 0;
      const ageP = Date.now() - tsP;
      const fiveMin = 5 * 60 * 1000;
      // If no cache yet or older than 5 minutes, prefetch a small page (non-blocking)
      if (!localStorage.getItem('products_cache') || ageP > fiveMin) {
        const doPrefetch = () => {
          this.productService.list({ page: 1, per_page: 50 }).subscribe({
            next: (res: any) => {
              try {
                const data = Array.isArray(res) ? res : (res.data || []);
                const meta = Array.isArray(res) ? { current_page: 1, last_page: 1, total: data.length, per_page: 50 } : (res.meta || { current_page: 1, last_page: 1, total: (res?.meta?.total||0), per_page: 50 });
                // Only overwrite an existing cache if the new response contains data
                // or if there was no previous cache at all. This prevents unauthenticated
                // or error responses (which can be empty) from wiping a valid cached list.
                const hadCache = !!localStorage.getItem('products_cache');
                const hasData = Array.isArray(data) ? data.length > 0 : ((meta && (meta.total || 0) > 0) || (Array.isArray(data) && data.length > 0));
                if (hasData || !hadCache) {
                  localStorage.setItem('products_cache', JSON.stringify({ data, meta }));
                  localStorage.setItem('products_cache_ts', String(Date.now()));
                } else {
                  // keep existing cache intact
                }
              } catch (e) { /* ignore storage errors */ }
            },
            error: () => { /* ignore prefetch errors */ }
          });
        };

        if (this.authService.isAuthenticated) {
          doPrefetch();
        } else {
          // Wait until auth finishes so prefetch runs authenticated and won't store an empty cache
          this.authService.currentUser$.pipe(filter(u => !!u), take(1)).subscribe(() => doPrefetch());
        }
      }
    } catch (e) { /* ignore */ }
  }

  showTooltip(evt: MouseEvent, m: ModuleManifest): void {
    this.tooltipTitle = m.title;
    const el = evt.currentTarget as HTMLElement | null;
    if (el) {
      const r = el.getBoundingClientRect();
      // position to the right of the icon and vertically centered
      this.tooltipX = Math.min(window.innerWidth - 16, Math.round(r.right + 10));
      this.tooltipY = Math.max(8, Math.round(r.top + r.height / 2));
    } else {
      this.tooltipX = evt.clientX + 12;
      this.tooltipY = Math.max(8, evt.clientY - 28);
    }
    // Debug logs to verify events and computed coords
    // Keep these logs temporary while we debug visibility
    // eslint-disable-next-line no-console
    console.log('[AppComponent] showTooltip', { key: (m as any).key, title: m.title, x: this.tooltipX, y: this.tooltipY });
    // Create a tooltip element appended to document.body to avoid being clipped by any parent
    this.createTooltipElement(this.tooltipX, this.tooltipY, m.title);
  }

  hideTooltip(): void {
    // eslint-disable-next-line no-console
    console.log('[AppComponent] hideTooltip');
    this.tooltipTitle = null;
    this.removeTooltipElement();
  }

  private createTooltipElement(x: number, y: number, title: string): void {
    this.removeTooltipElement();
    try {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('id', 'app-tooltip');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '0px';
      wrapper.style.top = '0px';
      wrapper.style.zIndex = '2147483647';
      wrapper.style.pointerEvents = 'none';

      const container = document.createElement('div');
      container.style.position = 'absolute';
      // small horizontal offset so bubble does not touch the icon
      const adjustedX = Math.min(window.innerWidth - 16, x + 6);
      container.style.left = `${adjustedX}px`;
      container.style.top = `${y}px`;
      container.style.transform = 'translateY(-50%)';

      const inner = document.createElement('div');
      inner.style.position = 'relative';
      inner.style.display = 'inline-flex';
      inner.style.alignItems = 'center';
      inner.style.gap = '0';

      const bubble = document.createElement('div');
      bubble.style.padding = '8px 12px';
      bubble.style.borderRadius = '10px';
      bubble.style.background = 'rgba(0,0,0,0.9)';
      bubble.style.color = 'white';
      bubble.style.fontSize = '13px';
      bubble.style.fontWeight = '600';
      bubble.style.whiteSpace = 'nowrap';
      bubble.style.boxShadow = '0 8px 24px rgba(0,0,0,0.45)';
      bubble.textContent = title;

      inner.appendChild(bubble);
      container.appendChild(inner);
      wrapper.appendChild(container);
      document.body.appendChild(wrapper);
      this.tooltipEl = wrapper;
      // Appear transition
      wrapper.style.opacity = '0';
      wrapper.style.transition = 'opacity 160ms ease, transform 160ms ease';
      // small translate to the right for subtle motion
      wrapper.style.transform = 'translateX(4px)';
      requestAnimationFrame(() => {
        wrapper.style.opacity = '1';
        wrapper.style.transform = 'translateX(0)';
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[AppComponent] createTooltipElement failed', err);
    }
  }

  private removeTooltipElement(): void {
    if (this.tooltipEl) {
      try {
        this.tooltipEl.remove();
      } catch (e) {
        // ignore
      }
      this.tooltipEl = null;
    }
  }

  ngOnDestroy(): void {
    this.removeTooltipElement();
    document.removeEventListener('click', this.handleDocumentClick);
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return '?';
    const names = this.currentUser.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.currentUser.name.substring(0, 2).toUpperCase();
  }

  getUserPlan(): string {
    return ((this.currentUser as any)?.plan) || 'Gratis';
  }

  getTenantName(): string {
    // Try tenant object first, then fallback to common API field `tenant_name`, then default
    const t = (this.currentUser as any)?.tenant;
    if (t && t.name) return t.name;
    const tn = (this.currentUser as any)?.tenant_name;
    if (tn) return tn;
    return 'ERP Modular';
  }

  logout(): void {
    if (!confirm('¿Estás seguro de cerrar sesión?')) return;
    this.logoutInProgress = true;
    this.authService.logout().subscribe({
      next: () => {
        this.logoutInProgress = false;
        this.router.navigate(['/auth/login']).catch(() => {});
      },
      error: (err) => {
        this.logoutInProgress = false;
        // eslint-disable-next-line no-console
        console.error('[AppComponent] logout failed', err);
        alert('Error al cerrar sesión. Inténtalo de nuevo.');
      }
    });
  }

  openUpgrade(): void {
    this.showUpgradeModal = true;
  }

  closeUpgrade(): void {
    this.showUpgradeModal = false;
  }

  toggleLogout(): void {
    this.showLogoutAction = !this.showLogoutAction;
  }

  changePlan(): void {
    this.openUpgrade();
  }

  goToPersonalization(): void {
    this.router.navigate(['/settings/personalization']).catch(() => {});
  }

  goToSettings(): void {
    this.router.navigate(['/settings']).catch(() => {});
  }

  goToHelp(): void {
    this.router.navigate(['/help']).catch(() => {});
  }
}
