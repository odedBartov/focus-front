import { Component, OnInit } from '@angular/core';
import { GoogleSigninComponent } from '../google-signin/google-signin.component';

@Component({
  selector: 'app-authentication',
  imports: [GoogleSigninComponent],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss'
})
export class AuthenticationComponent {

  userSignedIn(jwt: string) {
    console.log(jwt);
    
  }
}
