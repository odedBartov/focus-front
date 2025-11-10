import { inject, Injectable } from '@angular/core';
import { User } from '../models/user';
import { map, Observable, of } from 'rxjs';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  httpService = inject(HttpService);
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
    if (JSON.stringify(user) === JSON.stringify(this.user)) return of();
    return this.httpService.updateUser(user).pipe(map(res => {
      this.user = res;
      return res;
    }));
  }
}
