import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // If the request URL is absolute (starts with http), don't prefix the API URL.
  const isAbsolute = /^https?:\/\//i.test(req.url);
  const url = isAbsolute ? req.url : `${environment.apiUrl.replace(/\/$/, '')}/${req.url.replace(/^\//, '')}`;
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Clone request and add headers
  let apiReq = req.clone({ url });
  
  if (token) {
    apiReq = apiReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  // Add Accept header
  apiReq = apiReq.clone({
    setHeaders: {
      'Accept': 'application/json'
    }
  });
  
  return next(apiReq).pipe(
    catchError(error => {
      // Handle 401 Unauthorized
      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        // Avoid forcing navigation to the login page when the failed request
        // is itself part of the authentication flow (e.g. /auth/me, /auth/refresh,
        // /auth/login, /auth/register) or when we are already on an auth route.
        // This prevents redirect loops or unwanted nav when the app checks
        // auth state in background (e.g. ModuleRegistry -> auth.me()).
        try {
          const currentUrl = router.url || '';
          const reqUrl = apiReq.url || req.url || '';
          const isAuthRoute = currentUrl.startsWith('/auth');
          const isAuthApi = /\/auth\/(me|refresh|login|register|logout)/i.test(reqUrl);
          if (!isAuthRoute && !isAuthApi) {
            router.navigate(['/auth/login']);
          }
        } catch (e) {
          // If anything goes wrong, fall back to navigating to login.
          router.navigate(['/auth/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
