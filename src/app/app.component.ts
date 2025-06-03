import { Component, inject, Signal } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { LoadingService } from './services/loading.service';
import { AuthenticationService } from './services/authentication.service';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { Title } from '@angular/platform-browser';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-root',
  imports: [RouterModule, RouterOutlet, MatMenuModule, CommonModule, LottieComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent {
  router = inject(Router);
  loadingService = inject(LoadingService);
  authenticationService = inject(AuthenticationService);
  titleService = inject(Title);
  breakpointObserver = inject(BreakpointObserver);
  isLoading: Signal<boolean>;
  options: AnimationOptions = {
    path: '/assets/animations/loader.json',
  };
  isPhone = false;
  isTablet = false;

  constructor() {    
    this.isLoading = this.loadingService.getIsLoading();
    if (!this.isDesktop()) {
      this.router.navigate(['unsupportedDevice']);
    } else {
      const fullName = this.authenticationService.getUserName();
      if (fullName) {
        this.titleService.setTitle("פוקוס - " + fullName);
      }
    }
  }

  isMobileOrTablet(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    return /android|ipad|iphone|ipod|mobile|tablet/i.test(userAgent.toLowerCase());
  }

  isMobile(): boolean {
    return this.breakpointObserver.isMatched(Breakpoints.Handset);
  }

  isDesktop(): boolean {
    return this.breakpointObserver.isMatched(Breakpoints.Web);
  }

  navigateToHomePage() {
    this.router.navigate(['/home']);
  }

  signOut() {
    this.authenticationService.deleteToken();
    this.router.navigate(['/login']);
  }
}
