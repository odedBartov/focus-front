import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { SocialLoginModule, SocialAuthServiceConfig, GoogleLoginProvider } from '@abacritt/angularx-social-login';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes),
  provideAnimations(),
  provideHttpClient(),
  importProvidersFrom(SocialLoginModule),
  ]
};

{
  // provide: 'SocialAuthServiceConfig',
  // useValue: {
  //   autoLogin: false,
  //   providers: [
  //     {
  //       id: GoogleLoginProvider.PROVIDER_ID,
  //       provider: new GoogleLoginProvider('834564132220-5hncletadkegj4vaabrh2joj9rc586ai.apps.googleusercontent.com', {
  //         oneTapEnabled: false
  //       }),
  //     },
  //   ],
  // } as SocialAuthServiceConfig,
}