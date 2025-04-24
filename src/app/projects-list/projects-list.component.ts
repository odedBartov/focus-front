import { Component, inject, Input } from '@angular/core';
import { Project } from '../models/project';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { ProjectStatus } from '../models/enums';
import { UserProjects } from '../models/userProjects';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-projects-list',
  imports: [CommonModule, MatProgressBarModule, MatMenuModule],
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss'
})
export class ProjectsListComponent {
  @Input() projects?: UserProjects;
  router = inject(Router);
  projectStatusEnum = ProjectStatus;
  selectedStatus = ProjectStatus.active;

  selectProjectStatus(status: ProjectStatus) {
    this.selectedStatus = status;
  }

  getProjectsForStatus() {
    switch (this.selectedStatus) {
      case ProjectStatus.active:
        return this.projects?.activeProjects
      case ProjectStatus.frozen:
        return this.projects?.frozenProjects
      case ProjectStatus.finished:
        return this.projects?.finishedProjects
    }
  }

  getCurrentStep(project: Project) {
    return project.steps?.find(s => !s.isComplete);
  }

  getProjectProgress(project: Project) {
    const completedSteps = project.steps?.filter(s => s.isComplete).length;
    return ((completedSteps ?? 0) / (project.steps?.length ?? 1)) * 100;
  }

  changeProjectStatus(project: Project, status: ProjectStatus) {
    project.status = status;
    // update server
  }

  navigateToProject(projectId: string | undefined) {
    this.router.navigate(['/project', projectId, false]);
  }
}
