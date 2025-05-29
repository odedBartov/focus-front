import { Component, inject, Signal } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { LoadingService } from './services/loading.service';
import { AuthenticationService } from './services/authentication.service';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { Title } from '@angular/platform-browser';

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
  isLoading: Signal<boolean>;
  options: AnimationOptions = {
    path: '/assets/animations/loader.json',
  };

  constructor() {
    this.isLoading = this.loadingService.getIsLoading();
    const fullName = this.authenticationService.getUserName();
    if (fullName) {
      this.titleService.setTitle("פוקוס - " + fullName);
    }
  }

  navigateToHomePage() {
    this.router.navigate(['/home']);
  }

  signOut() {
    this.authenticationService.deleteToken();
    this.router.navigate(['/login']);
  }
}
