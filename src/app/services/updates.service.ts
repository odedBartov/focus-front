import { inject, Injectable } from '@angular/core';
import { InsightAndUpdates } from '../models/insightAndUpdates';
import { map, Observable, of } from 'rxjs';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class UpdatesService {
  httpService = inject(HttpService);
  insightsAndUpdates?: InsightAndUpdates;

  getInsightAndUpdates(): Observable<InsightAndUpdates> {
    if (this.insightsAndUpdates) {
      return of(this.insightsAndUpdates);
    } else {
      return this.httpService.getInsightAndUpdates().pipe(map(res => {
        this.insightsAndUpdates = res;
        return res;
      }));
    }
  }
}
