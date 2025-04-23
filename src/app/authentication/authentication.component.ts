import { Component, inject, OnInit } from '@angular/core';
import { GoogleSigninComponent } from '../google-signin/google-signin.component';
import { HttpService } from '../services/http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-authentication',
  imports: [GoogleSigninComponent],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss'
})
export class AuthenticationComponent {
  httpService = inject(HttpService);
  router = inject(Router);

  userSignedIn(jwt: string) {
    this.httpService.loginWithGoogleToken(jwt).subscribe(res => {
      this.router.navigate(['/home']);
    })
  }
}
