import { Component, inject, Input } from '@angular/core';
import { Project } from '../models/project';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-projects-list',
  imports: [CommonModule, MatProgressBarModule],
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss'
})
export class ProjectsListComponent {
  @Input() projects?: Project[];
  router = inject(Router);
  
  navigateToProject(projectId: string | undefined) {    
    this.router.navigate(['/project', projectId, false]);
  }
}
