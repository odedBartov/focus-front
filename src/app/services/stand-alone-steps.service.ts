import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { Step } from '../models/step';

@Injectable({
  providedIn: 'root'
})
export class StandAloneStepsService {
  httpService = inject(HttpService);
  steps?: Step[];
  noProjectId = "noProject";

  getSteps(): Observable<Step[]> {
    if (this.steps) {
      return of(this.steps);
    } else {
      return this.httpService.getSteps(this.noProjectId).pipe(map(res => {
        this.steps = res;
        return res;
      }));
    }
  }
}
