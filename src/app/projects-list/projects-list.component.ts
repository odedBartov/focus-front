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

@Component({
  selector: 'app-projects-list',
  imports: [CommonModule, MatProgressBarModule, MatMenuModule, DragDropModule, MatTooltipModule],
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
  hoveredProject = this.projectHoverService.getSignal();
  private _projects!: UserProjects;
  @Input()
  set projects(val: UserProjects) {
    this._projects = val;
    this.selectProjectStatus(this.projectStatusEnum.active);
    this.rearrangeUserProjects();
  }

  get projects(): UserProjects {
    return this._projects;
  }

  router = inject(Router);
  projectStatusEnum = ProjectStatus;
  selectedStatus!: ProjectStatus;
  selectedProjects: Project[] = [];

  rearrangeUserProjects() {
    if (this.projects) {
      this.rearrangeProjects(this.projects.activeProjects);
      this.rearrangeProjects(this.projects.frozenProjects);
      this.rearrangeProjects(this.projects.finishedProjects);
    }
  }

  rearrangeProjects(projects: Project[]) {
    projects = projects.sort((a, b) => a.positionInList - b.positionInList);
  }

  selectProjectStatus(status: ProjectStatus) {
    this.selectedStatus = status;
    this.selectedProjects = this.getProjectsForStatus() ?? [];
  }

  getProjectsForStatus(status?: ProjectStatus): Project[] | undefined {
    const statusToReturn = status ?? this.selectedStatus;
    switch (statusToReturn) {
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
    return ((completedSteps ?? 0) / (project.steps?.length > 0 ? project.steps.length : 1)) * 100;

  }

  getPaidMoney(project: Project) {
    const steps = project.steps?.filter(s => s.isComplete && s.stepType === StepType.payment);
    return steps?.reduce((sum, step) => sum + step.price, 0) ?? 0;
  }

  changeProjectStatus(project: Project, status: ProjectStatus) {
    project.status = status;
    this.updateProjects([project]).subscribe(res => {
      const oldStatusList = this.getProjectsForStatus();
      oldStatusList?.splice(oldStatusList.indexOf(project), 1);
      const newStatusList = this.getProjectsForStatus(project.status);
      newStatusList?.push(project);

      this.activeProjectsEmitter.emit(this.projects.activeProjects);
    });
  }

  togglePriority(event: Event, project: Project) {
    event.stopPropagation()
    project.isPriority = !project.isPriority;
    if (project.isPriority) {
      const currentIndex = this.selectedProjects.indexOf(project);
      moveItemInArray(this.selectedProjects, currentIndex, 0);
      this.updateProjectsPosition();
      this.activeProjectsEmitter.emit(this.projects.activeProjects);
    }

    this.updateProjects(this.selectedProjects).subscribe(res => { });
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selectedProjects, event.previousIndex, event.currentIndex);
    this.updateProjectsPosition();
    this.updateProjects(this.selectedProjects).subscribe(res => { });
  }

  updateProjectsPosition() {
    for (let index = 0; index < this.selectedProjects.length; index++) {
      this.selectedProjects[index].positionInList = index;
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

  openProjectModal() {
    const dialogRef = this.dialog.open(NewProjectComponent);
    dialogRef.afterClosed().subscribe(res => {
      this.loadingService.changeIsloading(true);
      this.httpService.createProject(res).subscribe(newProject => {
        this.projects.activeProjects.push(newProject);
        this.loadingService.changeIsloading(false);
      })
    })
  }
}
