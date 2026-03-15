import { Injectable, inject } from '@angular/core';
import { Subject, Observable, concatMap, tap } from 'rxjs';
import { Step } from '../models/step';
import { HttpService } from './http.service';

interface QueuedRequest {
  startDate: Date;
  endDate: Date;
  result$: Subject<Step[]>;
}

@Injectable({
  providedIn: 'root'
})
export class RetainerStepsQueueService {
  private httpService = inject(HttpService);
  private queue$ = new Subject<QueuedRequest>();

  constructor() {
    this.queue$.pipe(
      concatMap(({ startDate, endDate, result$ }) =>
        this.httpService.getRetainerSteps(startDate, endDate).pipe(
          tap({
            next: (steps) => { result$.next(steps); result$.complete(); },
            error: (err) => { result$.error(err); }
          })
        )
      )
    ).subscribe();
  }

  getRetainerSteps(startDate: Date, endDate: Date): Observable<Step[]> {
    const result$ = new Subject<Step[]>();
    this.queue$.next({ startDate, endDate, result$ });
    return result$.asObservable();
  }
}
