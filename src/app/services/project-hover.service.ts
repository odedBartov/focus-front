import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProjectHoverService {
  hoveredProjectId = signal<string | undefined>(undefined);

  getSignal() {
    return this.hoveredProjectId.asReadonly();
  }

  projectHover(projectId?: string) {
    this.hoveredProjectId.set(projectId);
  }
}
