import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, merge, Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutoRefreshService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private lastActivityTime = Date.now();
  private lastMidnight = this.getMidnight(new Date());
  private needsRefresh = false;
  private inactivityTimeout: any;
  inactivityTimeSpan = 60000; 

  private manualCountdownActive = false;

  constructor() {
    this.trackActivity();
    this.scheduleNextMidnight();
  }

  private getMidnight(date: Date): number {
    const midnight = new Date(date);
    midnight.setHours(24, 0, 0, 0); 
    return midnight.getTime();
  }

  private trackActivity(): void {
    merge(
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'mousemove')
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // 1. Update activity time IMMEDIATELY
      this.lastActivityTime = Date.now();

      // 2. Manual Countdown Reset Logic: Resets the timer instantly
      if (this.manualCountdownActive) {
        this.startManualCountdown(); 
      }
      
      // 3. Midnight Refresh Logic 
      if (this.needsRefresh) {
        this.startInactivityCountdown();
      }
    });
  }

  private scheduleNextMidnight(): void {
    const now = Date.now();
    const timeUntilMidnight = this.lastMidnight - now;

    if (timeUntilMidnight > 0) {
      setTimeout(() => this.onMidnightPassed(), timeUntilMidnight);
    } else {
      this.onMidnightPassed();
    }
  }

  private onMidnightPassed(): void {
    this.needsRefresh = true;
    this.startInactivityCountdown();
  }

  // This method handles the scheduled check for midnight refresh.
  private startInactivityCountdown(): void {
    clearTimeout(this.inactivityTimeout);

    this.inactivityTimeout = setTimeout(() => {
      const inactiveDuration = Date.now() - this.lastActivityTime;
      if (inactiveDuration >= this.inactivityTimeSpan) {
        window.location.reload();
      } else {
        // Check again after remaining time
        this.startInactivityCountdown();
      }
    }, this.inactivityTimeSpan);
  }

  // This method handles the manual countdown and acts as the reset target.
  startManualCountdown(): void {
    // 1. Activate the manual mode
    if (!this.manualCountdownActive) {
      this.manualCountdownActive = true;
      // Ensure the countdown starts relative to now if it's the first call
      this.lastActivityTime = Date.now(); 
    }

    // 2. Clear any existing timeout (the reset)
    clearTimeout(this.inactivityTimeout);

    // 3. Calculate remaining time based on the last recorded activity
    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    const remainingTime = Math.max(0, this.inactivityTimeSpan - timeSinceLastActivity);

    // 4. Schedule the action
    this.inactivityTimeout = setTimeout(() => {
      const inactiveDuration = Date.now() - this.lastActivityTime;
      if (inactiveDuration >= this.inactivityTimeSpan) {
        window.location.reload();
        this.manualCountdownActive = false; // Stop the manual countdown after success
      } else {
        // If activity was missed/delayed, restart the check
        this.startManualCountdown(); 
      }
    }, remainingTime);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.inactivityTimeout);
  }
}