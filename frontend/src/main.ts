import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';
import { CoreModule } from './app/core/core.module';
import { SharedModule } from './app/shared/shared.module';
import { apiInterceptor } from './app/core/http-interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(AppRoutingModule, CoreModule, SharedModule),
    provideHttpClient(withInterceptors([apiInterceptor]))
  ]
}).catch(err => console.error(err));
