import { Injectable, Signal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  isLoading = signal<boolean>(false);
  counter = 0;
  
  getIsLoading(): Signal<boolean> {
    return this.isLoading;
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
