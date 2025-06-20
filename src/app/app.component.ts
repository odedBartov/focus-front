import { Component, inject, NgZone, OnInit, Signal } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { AnimationsService } from './services/animations.service';
import { AuthenticationService } from './services/authentication.service';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { Title } from '@angular/platform-browser';
import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { AnimationItem } from 'lottie-web';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterModule, RouterOutlet, MatMenuModule, CommonModule, LottieComponent, LayoutModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent implements OnInit {
  hj: any;
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

    this.initHotJar();
  }

  initHotJar() {
    if (environment.production) {
      const hotjarScript = document.createElement('script');
      hotjarScript.innerHTML = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:6439691,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
      document.head.appendChild(hotjarScript);
    }
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
