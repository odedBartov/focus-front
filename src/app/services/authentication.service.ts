import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { subscriptionEnum } from '../models/enums';
import { taxManagementSystemEnum } from '../models/taxSystem';
import { UserStatus } from '../models/user';

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
  userId = "userId";
  userApiKey = "user-api-key";
  userTaxManagementSystem = "user-tax-management-system";
  userTaxManagementCompanyId = "user-tax-management-company-id";
  isReadOnlySignal = signal<boolean>(false);
  userStatus = "user-status";

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

  getUserId() {
    return localStorage.getItem(this.userId);
  }

  setUserId(userId: string) {
    localStorage.setItem(this.userId, userId);
  }

  setUserApiKey(apiKey: string) {
    localStorage.setItem(this.userApiKey, apiKey);
  }

  getUserApiKey() {
    return localStorage.getItem(this.userApiKey);
  }

  setUserTaxManagementSystem(system: taxManagementSystemEnum) {
    localStorage.setItem(this.userTaxManagementSystem, system.toString());
  }

  getUserTaxManagementSystem() {
    const system = localStorage.getItem(this.userTaxManagementSystem);
    if (system) {
      return (parseInt(system)) as unknown as taxManagementSystemEnum;
    }
    return undefined;
  }

  setUserStatus(status: UserStatus) {
    localStorage.setItem(this.userStatus, status.toString());
  }

  getUserStatus() {
    const status = localStorage.getItem(this.userStatus);
    if (status) {
      return status as unknown as UserStatus;
    }
    return UserStatus.exemptDealer;
  }

  setUserTaxManagementCompanyId(companyId: number) {
    localStorage.setItem(this.userTaxManagementCompanyId, companyId.toString());
  }

  getUserTaxManagementCompanyId() {
    const companyId = localStorage.getItem(this.userTaxManagementCompanyId);
    if (companyId) {
      return parseInt(companyId, 10);
    }
    return 0;
  }

  logOut() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
