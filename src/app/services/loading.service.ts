import { Injectable, Signal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  isLoading = signal<boolean>(false);
  
  getIsLoading(): Signal<boolean> {
    return this.isLoading;
  }

  changeIsloading(value: boolean): void {
    //this.isLoading.set(value);
  }
}
