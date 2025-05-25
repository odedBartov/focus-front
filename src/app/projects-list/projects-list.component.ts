import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Project } from '../models/project';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { ProjectStatus, StepType } from '../models/enums';
import { UserProjects } from '../models/userProjects';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpService } from '../services/http.service';
import { LoadingService } from '../services/loading.service';
import { tap } from 'rxjs';
import { ProjectHoverService } from '../services/project-hover.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { NewProjectComponent } from '../modals/new-project/new-project.component';
import { TodayTasksComponent } from "../today-tasks/today-tasks.component";
import { Step } from '../models/step';
import { Task } from '../models/task';

@Component({
  selector: 'app-projects-list',
  imports: [CommonModule, MatProgressBarModule, MatMenuModule, DragDropModule, MatTooltipModule, TodayTasksComponent],
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss'
})
export class ProjectsListComponent {
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  dialog = inject(MatDialog);
  projectHoverService = inject(ProjectHoverService);
  @Output() selectProjectEmitter = new EventEmitter<Project>();
  @Output() activeProjectsEmitter = new EventEmitter<Project[]>();
  @Input() projects!: Project[];
  hoveredProject = this.projectHoverService.getSignal();
  router = inject(Router);
  projectStatusEnum = ProjectStatus;
  activeTab = 2;

  getCurrentStep(project: Project) {
    return project.steps?.find(s => !s.isComplete);
  }

  getProjectProgress(project: Project) {
    const completedSteps = project.steps?.filter(s => s.isComplete).length;
    return ((completedSteps ?? 0) / (project.steps?.length > 0 ? project.steps.length : 1)) * 100;

  }

  getPaidMoney(project: Project) {
    const steps = project.steps?.filter(s => s.isComplete && s.stepType === StepType.payment);
    return steps?.reduce((sum, step) => sum + step.price, 0) ?? 0;
  }

  changeProjectStatus(project: Project, status: ProjectStatus) {
    project.status = status;
    this.updateProjects([project]).subscribe(res => {
      this.projects?.splice(this.projects.indexOf(project), 1);
      this.activeProjectsEmitter.emit(this.projects);
    });
  }

  deleteProject(project: Project) {
    if (project.id) {
      this.loadingService.changeIsloading(true);
      this.httpService.deleteProject(project.id).subscribe(res => {
        const projectIndex = this.projects.indexOf(project);
        this.projects.splice(projectIndex, 1);
        this.loadingService.changeIsloading(false);
      })
    }
  }

  cloneProject(project: Project) {
    this.loadingService.changeIsloading(true);
    const clonedProject = { ...project };
    clonedProject.id = undefined;
    clonedProject.startDate = new Date();
    this.httpService.createProject(clonedProject).subscribe(res => {
      this.projects.push(res);
      this.loadingService.changeIsloading(false);
    })
  }

  togglePriority(event: Event, project: Project) {
    event.stopPropagation()
    project.isPriority = !project.isPriority;
    if (project.isPriority) {
      const currentIndex = this.projects.indexOf(project);
      moveItemInArray(this.projects, currentIndex, 0);
      this.updateProjectsPosition();
      this.activeProjectsEmitter.emit(this.projects);
    }

    this.updateProjects(this.projects).subscribe(res => { });
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.projects, event.previousIndex, event.currentIndex);
    this.updateProjectsPosition();
    this.updateProjects(this.projects).subscribe(res => { });
  }

  updateProjectsPosition() {
    for (let index = 0; index < this.projects.length; index++) {
      this.projects[index].positionInList = index;
    }
  }

  updateProjects(projects: Project[]) {
    this.loadingService.changeIsloading(true);
    return this.httpService.updateProjects(projects).pipe(tap(res => {
      this.loadingService.changeIsloading(false);
    }));
  }

  selectProject(project: Project) {
    this.selectProjectEmitter.emit(project);
  }

  getTasks() {
    const projectsAndSteps: Task[] = [];

    this.projects.forEach(project => {
      if (project?.steps) {
        const currentStep = project.steps.find(s => !s.isComplete);
        if (currentStep && (!currentStep.hideTaskDate || !this.isWithinLastDay(currentStep.hideTaskDate))) {
          projectsAndSteps.push({ project: project, step: currentStep });
        }
      }
    })

    return projectsAndSteps;
  }

  isWithinLastDay(date: Date) {
    const today = new Date();
    const dateToCheck = new Date(date);
    return today.getFullYear() === dateToCheck.getFullYear() &&
           today.getMonth() === dateToCheck.getMonth() &&
           today.getDay() === dateToCheck.getDay()
}

  openProjectModal() {
    const dialogRef = this.dialog.open(NewProjectComponent);
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.loadingService.changeIsloading(true);
        this.httpService.createProject(res).subscribe(newProject => {
          this.projects.push(newProject);
          this.loadingService.changeIsloading(false);
        })
      }
    })
  }
}
