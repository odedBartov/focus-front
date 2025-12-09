import { ApplicationRef, inject, Injectable, NgZone } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { concat, filter, first, interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VersionUpdatesService {
  swUpdate = inject(SwUpdate);
  appRef = inject(ApplicationRef);
  ngZone = inject(NgZone);

  constructor() {
    this.checkForUpdateOnStable();
    this.subscribeToUpdateEvents();
  }

  // 1. Checks for updates periodically (e.g., every 6 hours) once the app is stable
  private checkForUpdateOnStable() {
    if (this.swUpdate.isEnabled) {
      // Run the entire polling setup OUTSIDE of NgZone to allow the app to stabilize
      this.ngZone.runOutsideAngular(() => {
        // Allow the application to stabilize (finish initial rendering)
        const appIsStable$ = this.appRef.isStable.pipe(
          first(isStable => isStable === true)
        );

        // Set the interval for checking (5 seconds for testing)
        // Use your final 6 hours interval here: interval(6 * 60 * 60 * 1000)
        const checkInterval$ = interval(5 * 1000);

        // Concatenate: Wait for stable, then start the interval checks
        const everySixHoursOnceAppIsStable$ = concat(appIsStable$, checkInterval$);

        everySixHoursOnceAppIsStable$.subscribe(() => {
          // IMPORTANT: Use ngZone.run() to re-enter the zone for UI updates (like alert)
          this.ngZone.run(() => {
            console.log("in interval - RUNNING NOW");
            alert("in interval - RUNNING NOW");
          });

          alert("outside zone")

          // This Service Worker interaction is safe outside the zone
          this.swUpdate.checkForUpdate();
        });
      });
    } else {
      // This is safe to run inside the zone
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
