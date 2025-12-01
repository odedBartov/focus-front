
import { Component, EventEmitter, Output } from '@angular/core';

declare global {
  interface Window {
    google: any;
  }
}

@Component({
  selector: 'app-google-signin',
  standalone: true,
  templateUrl: './google-signin.component.html',
  styleUrl: 'google-signin.component.scss'
})
export class GoogleSigninComponent {
  @Output() googleLoginEmitter = new EventEmitter<string>();
  private codeClient: any;
  termsAndConditionsUrl: string = 'https://arieladler.co.il/focus/focus-terms/';
  privacyPolicyUrl: string = 'https://arieladler.co.il/focus/focus-privacy/';

  initGoogleClient() {
    this.codeClient = window.google.accounts.oauth2.initCodeClient({
      client_id: '834564132220-5hncletadkegj4vaabrh2joj9rc586ai.apps.googleusercontent.com',
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: (response: any) => {
        if (response.code) {
          this.googleLoginEmitter.emit(response.code);
        }
      },
    });
  }

  onGoogleSignInClick(): void {
    this.initGoogleClient();
    setTimeout(() => {
      this.codeClient.requestCode();
    }, 1);
  }

  goToTermsAndConditions() {
    window.open(this.termsAndConditionsUrl, '_blank');
  }

  goToPrivacyPolicy() {
    window.open(this.privacyPolicyUrl, '_blank');
  }
}
