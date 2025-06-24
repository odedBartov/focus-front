import { Component, EventEmitter, inject, Input, Output, WritableSignal } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { Project } from '../../models/project';
import { ProjectStatus, StepType } from '../../models/enums';
import { tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-archive',
  imports: [CommonModule, MatProgressBarModule, MatMenuModule, DragDropModule, MatTooltipModule],
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.scss'
})
export class ArchiveComponent {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  projectsService = inject(ProjectsService);
  projects: WritableSignal<Project[]>;
  projectStatusEnum = ProjectStatus;

  constructor() {
    this.projects = this.projectsService.getUnActiveProjects();
  }

  drop(event: CdkDragDrop<string[]>) {
    const projects = [...this.projects()];
    moveItemInArray(projects, event.previousIndex, event.currentIndex);
    this.updateProjectsPosition(projects);
    this.updateProjects(this.projects()).subscribe(res => {
      this.projects.set(projects);
    });
  }

  updateProjectsPosition(projects: Project[]) {
    for (let index = 0; index < projects.length; index++) {
      projects[index].positionInList = index;
    }
  }

  getBasePrice(project: Project) {
    const steps = project.steps?.filter(s => s.stepType === StepType.payment);
    return steps?.reduce((sum, step) => sum + step.price, 0) ?? 0;
  }

  activateProject(project: Project) {
    project.status = ProjectStatus.active;
    project.positionInList += 99999;
    this.updateProjects([project]).subscribe(res => {
      const projectIndex = this.projects().indexOf(project);
      const projects = [...this.projects()];
      projects.splice(projectIndex, 1);
      const activeProjects = this.projectsService.getActiveProjects();
      activeProjects.set(activeProjects().concat(project));
      this.projects.set(projects);
    });
  }

  cloneProject(project: Project) {
    this.animationsService.changeIsloading(true);
    const clonedProject = { ...project };
    clonedProject.id = undefined;
    clonedProject.startDate = new Date();
    this.httpService.createProject(clonedProject).subscribe(res => {
      this.projects.set(this.projects().concat(res))
      this.animationsService.changeIsloading(false);
    })
  }

  deleteProject(project: Project) {
    if (project.id) {
      this.animationsService.changeIsloading(true);
      this.httpService.deleteProject(project.id).subscribe(res => {
        const projectIndex = this.projects().indexOf(project);
        this.projects().splice(projectIndex, 1);
        this.animationsService.changeIsloading(false);
      })
    }
  }

  updateProjects(projects: Project[]) {
    this.animationsService.changeIsLoadingWithDelay();
    return this.httpService.updateProjects(projects).pipe(tap(res => {
      this.animationsService.changeIsloading(false);
    }));
  }
}
