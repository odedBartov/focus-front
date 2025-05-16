import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  userTokenKey = 'user-token';
  userName = 'user-name';
  isNewUser = 'isNewUSer';

  getToken() {
    return localStorage.getItem(this.userTokenKey);
  }

  setToken(token: string) {
    localStorage.setItem(this.userTokenKey, token)
  }

  deleteToken() {
    localStorage.clear();
  }

  setUserName(name: string) {
    localStorage.setItem(this.userName, name);
  }

  getUserName() {
    return localStorage.getItem(this.userName);
  }

  setNewUser(isNew: boolean) {
    localStorage.setItem(this.isNewUser, String(isNew));
  }

  getIsNewUser() {
    return Boolean(localStorage.getItem(this.isNewUser));
  }
}
