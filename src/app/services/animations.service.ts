import { Injectable, Signal, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnimationsService {
  isLoading = signal<boolean>(false);
  finishProject = new Subject<void>();
  counter = 0;
  averageRequestTime = 400;
  animationDelay?: any;
  
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

  changeIsLoadingWithDelay() {
    this.animationDelay = setTimeout(() => {
      this.counter++;
    }, this.averageRequestTime);
  }

  hideIsLoading() {
    clearTimeout(this.animationDelay);
    this.counter = 0;
    this.isLoading.set(false);
  }
}
