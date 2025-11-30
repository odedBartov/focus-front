import { Injectable, OnDestroy } from '@angular/core';
import { debounceTime, fromEvent, merge, Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutoRefreshService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private lastActivityTime = Date.now();
  private lastMidnight = this.getMidnight(new Date());
  private needsRefresh = false;
  private inactivityTimeout: any;
  inactivityTimeSpan = 120000;

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
      fromEvent(document, 'touchstart')
    ).pipe(
      debounceTime(4000),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.lastActivityTime = Date.now();

      // If refresh is needed and user becomes active, start inactivity countdown
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.inactivityTimeout);
  }
}
