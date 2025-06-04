import { Injectable, Signal, signal } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnimationsService {
  isLoading = signal<boolean>(false);
  finishProject = new Subject<void>();
  counter = 0;
  
  getIsLoading(): Signal<boolean> {
    return this.isLoading;
  }

  getFinishProject(): Observable<void> {
    return this.finishProject.asObservable();
  }

  showFinishProject() {
    this.finishProject.next();
  }

  changeIsloading(value: boolean): void {
    this.counter += value? 1 : -1;    
    this.isLoading.set(this.counter > 0);
  }

  hideIsLoading() {
    this.counter = 0;
    this.isLoading.set(false);
  }
}
