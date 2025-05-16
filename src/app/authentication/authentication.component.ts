import { Component, inject, OnInit } from '@angular/core';
import { GoogleSigninComponent } from '../google-signin/google-signin.component';
import { HttpService } from '../services/http.service';
import { Router } from '@angular/router';
import { LoadingService } from '../services/loading.service';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-authentication',
  imports: [GoogleSigninComponent],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss'
})
export class AuthenticationComponent {
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  router = inject(Router);
  authenticationService = inject(AuthenticationService);

  userSignedIn(jwt: string) {
    this.loadingService.changeIsloading(true);
    this.httpService.loginWithGoogleToken(jwt).subscribe(
      res => {
        this.loadingService.changeIsloading(false);
        if (this.authenticationService.getIsNewUser()) {
          // start proccess
        } else {
          this.router.navigate(['/home']);
        }
      }
    );
  }
}
