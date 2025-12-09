import { ApplicationRef, inject, Injectable } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { filter, interval } from 'rxjs';

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
      // The interval now starts immediately (every 5 seconds for testing)
      const checkInterval$ = interval(4 * 1000);
      // We only subscribe to the interval now
      checkInterval$.subscribe(() => {
        // This check is the crucial part, and runs safely outside the zone.
        this.swUpdate.checkForUpdate();
      });
  } else {
    console.log("problem: Service Worker not enabled.");
  }
}

  // 2. Listen for a new version being ready and force the reload
  private subscribeToUpdateEvents() {
    this.swUpdate.versionUpdates.pipe(
      // Filter for the specific event type that means a new version is downloaded and ready
      filter((event: VersionEvent): event is { type: 'VERSION_READY', currentVersion: any, latestVersion: any } => event.type === 'VERSION_READY')
    ).subscribe(() => {
      console.log('New version downloaded and ready. Forcing update.');
      alert("got here")
      // Activate the update and force a full page reload to switch to the new version
      this.swUpdate.activateUpdate().then(() => document.location.reload());
    });
  }
}
