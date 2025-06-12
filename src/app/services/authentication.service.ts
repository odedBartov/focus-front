import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

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

  logOut() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
