import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { subscriptionEnum } from '../models/enums';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  router = inject(Router);
  userTokenKey = 'user-token';
  firstName = 'first-name';
  lastName = "last-name";
  isNewUser = 'is-new-user';
  userPicture = "user-picture";
  isReadOnly = "is-read-only";
  subscription = "subscription";
  isConsentAi: boolean | undefined = false;
  isReadOnlySignal = signal<boolean>(false);

  getToken() {
    return localStorage.getItem(this.userTokenKey);
  }

  setToken(token: string) {
    localStorage.setItem(this.userTokenKey, token)
  }

  deleteToken() {
    localStorage.clear();
  }

  setUserName(firstName: string, lastName: string) {
    localStorage.setItem(this.firstName, firstName ?? "");
    localStorage.setItem(this.lastName, lastName ?? "");
  }

  getUserName() {
    const firstName = localStorage.getItem(this.firstName);
    const lastName = localStorage.getItem(this.lastName);
    if (!firstName && !lastName) {
      return undefined;
    }
    return `${firstName ?? ''} ${lastName ?? ''}`;
  }

  getFirstName() {
    return localStorage.getItem(this.firstName);
  }

  setNewUser(isNew: boolean) {
    localStorage.setItem(this.isNewUser, String(isNew));
  }

  getIsNewUser() {
    return localStorage.getItem(this.isNewUser) === 'true';
  }

  setUserPicture(picture: string) {
    localStorage.setItem(this.userPicture, picture);
  }

  getUserPicture() {
    return localStorage.getItem(this.userPicture);
  }

  setIsReadOnly(isReadOnly: boolean) {
    this.isReadOnlySignal.set(isReadOnly);
  }

  getIsReadOnly() {
    return this.isReadOnlySignal;
  }

  setSubscription(subscription: number) {
    localStorage.setItem(this.subscription, subscription.toString());
  }

  getSubscription(): subscriptionEnum {
    const subscriptionString = localStorage.getItem(this.subscription);
    if (subscriptionString) {
      const subscriptionValue = parseInt(subscriptionString, 10);
      return subscriptionValue as subscriptionEnum;
    }
    return subscriptionEnum.free; // Default to free if not set
  }

  getIsConsentForAi() {
    return this.isConsentAi;
  }

  setIsConsentForAi(isConsent: boolean | undefined) {
    this.isConsentAi = isConsent;
  }

  logOut() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
