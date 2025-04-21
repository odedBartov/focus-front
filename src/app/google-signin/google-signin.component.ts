
import { Component, ElementRef, EventEmitter, inject, NgZone, OnInit, Output } from '@angular/core';

declare global {
  interface Window {
    google: any;
  }
}

@Component({
  selector: 'app-google-signin',
  standalone: true,
  template: `<div id="google-button"></div>`,
})
export class GoogleSigninComponent implements OnInit {
  private el = inject(ElementRef);
  private zone = inject(NgZone);
  @Output() googleLoginEmitter: EventEmitter<string> = new EventEmitter();

  ngOnInit(): void {
    window.google.accounts.id.initialize({
      client_id: '834564132220-5hncletadkegj4vaabrh2joj9rc586ai.apps.googleusercontent.com',
      auto_select: false,
      callback: (response: any) => {
        this.zone.run(() => this.handleCredentialResponse(response));
      }
    });

    window.google.accounts.id.renderButton(
      this.el.nativeElement.querySelector('#google-button'),
      {
        theme: 'outline',
        size: 'large'
      }
    );
  }

  handleCredentialResponse(response: any) {
    // console.log('JWT Token:', response.credential);
    this.googleLoginEmitter.emit(response.credential);
  }
}
