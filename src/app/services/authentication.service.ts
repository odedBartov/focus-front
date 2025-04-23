import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  userTokenKey = 'user-token';
  userName = 'user-name';

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
}
