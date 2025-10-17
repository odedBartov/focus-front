import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkSessionService {
  isSessionActive = false;
  private buzzSubject = new Subject<void>();
  buzzEvent$ = this.buzzSubject.asObservable();

  constructor() { }

  changeIsSessionActive(status: boolean) {
    this.isSessionActive = status;
  }

  getObservable() {
    return this.buzzEvent$;
  }

  tryToChangePage() {
    if (!this.isSessionActive) {
      return true;
    }

    this.buzzSubject.next();
    return false
  }
}
