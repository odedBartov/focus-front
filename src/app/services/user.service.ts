import { inject, Injectable } from '@angular/core';
import { User, UserStatus } from '../models/user';
import { map, Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { AuthenticationService } from './authentication.service';
import { taxManagementSystemEnum } from '../models/taxSystem';
import { subscriptionEnum } from '../models/enums';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  httpService = inject(HttpService);
  authenticationService = inject(AuthenticationService);
  user?: User;
  constructor() { }


  getUser(): Observable<User> {
    if (this.user) {
      return of(structuredClone(this.user));
    }

    return this.httpService.getUser().pipe(map((res: User) => {
      this.user = res;
      return res
    }));
  }

  updateUser(user: User) {
    return this.httpService.updateUser(user).pipe(map(res => {
      this.user = res;
      this.authenticationService.setUserStatus(res.status ?? UserStatus.exemptDealer);
      this.authenticationService.setUserTaxManagementSystem(res.taxManagementSystem ?? taxManagementSystemEnum.iCount);
      this.authenticationService.setUserTaxManagementCompanyId(res.taxManagementCompanyId ?? 0);
      this.authenticationService.setUserApiKey(res.taxManagementApiKey ?? '');
      this.authenticationService.setUserName(res.firstName ?? '', res.lastName ?? '');
      this.authenticationService.setSubscription(res.subscription ?? subscriptionEnum.free);
      return res;
    }));
  }
}
