import { Component, inject, Signal } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import {MatMenuModule} from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { LoadingService } from './services/loading.service';
import { AuthenticationService } from './services/authentication.service';
import { AnimationItem } from 'lottie-web';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';

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
  isLoading: Signal<boolean>;
  options: AnimationOptions = {
    path: '/assets/animations/loader.json',
  };

  constructor() {
    this.isLoading = this.loadingService.getIsLoading();
  }
  
  navigateToHomePage() {
      this.router.navigate(['/home']);
  }

  signOut() {
    this.authenticationService.deleteToken();
    this.router.navigate(['/login']);
  }
}
