import { Component, inject, NgZone, OnInit, Signal } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { AnimationsService } from './services/animations.service';
import { AuthenticationService } from './services/authentication.service';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { Title } from '@angular/platform-browser';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
import { AnimationItem } from 'lottie-web';

@Component({
  selector: 'app-root',
  imports: [RouterModule, RouterOutlet, MatMenuModule, CommonModule, LottieComponent, LayoutModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent implements OnInit {
  router = inject(Router);
  animationsService = inject(AnimationsService);
  authenticationService = inject(AuthenticationService);
  titleService = inject(Title);
  breakpointObserver = inject(BreakpointObserver);
  ngZone = inject(NgZone);
  isLoading: Signal<boolean>;
  loadingOptions: AnimationOptions = {
    path: '/assets/animations/loader.json',
  };
  finishProjectOptions: AnimationOptions = {
    path: "/assets/animations/project-end.json",
    autoplay: true,
    loop: false
  };
  showFinishProject = false;
  isPhone = false;
  isTablet = false;

  constructor() {
    this.isLoading = this.animationsService.getIsLoading();

    if (this.isMobileOrTablet()) {
      this.router.navigate(['unsupportedDevice']);
    } else {
      const fullName = this.authenticationService.getUserName();
      if (fullName) {
        this.titleService.setTitle("פוקוס - " + fullName);
      }
    }
  }

  ngOnInit(): void {
    this.animationsService.getFinishProject().subscribe(res => {
      this.showFinishProject = true;
    })
  }

  animationCreated(animation: AnimationItem) {
    animation.addEventListener('complete', () => {
      this.ngZone.run(() => {
        this.showFinishProject = false;
      });
    });
  }

  isMobileOrTablet(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|ipad|iphone|ipod|mobile|tablet/i.test(userAgent);
  }

  navigateToHomePage() {
    this.router.navigate(['/home']);
  }

  signOut() {
    this.authenticationService.deleteToken();
    this.router.navigate(['/login']);
  }
}
