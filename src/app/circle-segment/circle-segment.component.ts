import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { Project } from '../models/project';
import { ProjectHoverService } from '../services/project-hover.service';

@Component({
  selector: 'app-circle-segment',
  imports: [CommonModule],
  templateUrl: './circle-segment.component.html',
  styleUrl: './circle-segment.component.scss'
})
export class CircleSegmentComponent {
  projectHoverService = inject(ProjectHoverService);
  @Input() projects: Project[] = [];
  radius = 50;
  gapSize = 5;
  circumference = 2 * Math.PI * this.radius;

  get total(): number {
    return this.projects.reduce((sum, p) => sum + p.totalWorkingTime, 0);
  }

  get adjustedCircumference(): number {
    return this.circumference - this.projects.length * this.gapSize;
  }

  getDashArray(value: number): string {
    const length = (value / this.total) * this.adjustedCircumference;
    return `${length < 0 ? 0 : length} ${this.circumference}`;
  }

  getDashOffset(index: number): number {
    const previous = this.projects.slice(0, index).reduce((sum, p) => sum + p.totalWorkingTime, 0);
    const gapsBefore = index * this.gapSize;
    return -((previous / this.total) * this.adjustedCircumference + gapsBefore);
  }

  hoverOnProject(projectId?: string) {
    this.projectHoverService.projectHover(projectId);
  }

  stopHoveringProject() {
    this.projectHoverService.projectHover(undefined);
  }
}
