import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { Feature } from '../models/feature';

@Injectable({
  providedIn: 'root'
})
export class UpdatesService {
  httpService = inject(HttpService);
  futureFeatures?: Feature[];

  getFutureFeatures(): Observable<Feature[]> {
    if (this.futureFeatures) {
      return of(this.futureFeatures);
    } else {
      return this.httpService.getFutureFeatures().pipe(map(res => {
        this.futureFeatures = res;
        return res;
      }));
    }
  }
}
