import { ApplicationRef, inject, Injectable } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { concat, filter, first, interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VersionUpdatesService {
  swUpdate = inject(SwUpdate);
  appRef = inject(ApplicationRef);

  constructor() {
    this.checkForUpdateOnStable();
    this.subscribeToUpdateEvents();
  }

  // 1. Checks for updates periodically (e.g., every 6 hours) once the app is stable
  private checkForUpdateOnStable() {
    if (this.swUpdate.isEnabled) {
      // Allow the application to stabilize (finish initial rendering)
      const appIsStable$ = this.appRef.isStable.pipe(first(isStable => isStable === true));
      // Set the interval for checking (e.g., 6 hours = 6 * 60 * 60 * 1000)
      const everySixHours$ = interval(6 * 60 * 60 * 1000);
      const twoMinutes$ = interval(16 * 1000);

      // Concatenate: Check immediately after stable, then check every 6 hours
      const everySixHoursOnceAppIsStable$ = concat(appIsStable$, twoMinutes$);

      everySixHoursOnceAppIsStable$.subscribe(() => this.swUpdate.checkForUpdate());
    }
  }

  // 2. Listen for a new version being ready and force the reload
  private subscribeToUpdateEvents() {
    this.swUpdate.versionUpdates.pipe(
      // Filter for the specific event type that means a new version is downloaded and ready
      filter((event: VersionEvent): event is { type: 'VERSION_READY', currentVersion: any, latestVersion: any } => event.type === 'VERSION_READY')
    ).subscribe(() => {
      console.log('New version downloaded and ready. Forcing update.');
      // Activate the update and force a full page reload to switch to the new version
      this.swUpdate.activateUpdate().then(() => document.location.reload());
    });
  }
}
