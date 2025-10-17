import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkSessionService {
  isSessionActive = false;
  sessions: { [key: string]: number } = {};
  private buzzSubject = new Subject<void>();
  buzzEvent$ = this.buzzSubject.asObservable();

  constructor() { }

  changeIsSessionActive(status: boolean) {
    this.isSessionActive = status;
  }

  storeSession(projectId: string | undefined, session: number) {
    if (projectId) {
      this.sessions[projectId] = session;
    }
  }

  deleteSession(projectId: string | undefined) {
    if (projectId) delete this.sessions[projectId];
  }

  getSession(projectId: string | undefined): number | undefined {
    if (!projectId) return undefined;
    return this.sessions[projectId];
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
