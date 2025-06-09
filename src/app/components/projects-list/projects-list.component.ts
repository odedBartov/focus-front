import { Component, EventEmitter, inject, Input, Output, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { ProjectStatus, StepType } from '../../models/enums';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { tap } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { NewProjectComponent } from '../../modals/new-project/new-project.component';
import { TodayTasksComponent } from "../today-tasks/today-tasks.component";
import { Task } from '../../models/task';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-projects-list',
  imports: [CommonModule, MatProgressBarModule, MatMenuModule, DragDropModule, MatTooltipModule, TodayTasksComponent],
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss'
})
export class ProjectsListComponent {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  projectsService = inject(ProjectsService);
  dialog = inject(MatDialog);
  @Output() selectProjectEmitter = new EventEmitter<Project>();
  @Output() tasksUpatedEmitter = new EventEmitter<Project>();
  projects: WritableSignal<Project[]>;
  router = inject(Router);
  projectStatusEnum = ProjectStatus;
  activeTab = 1;

  constructor() {
    this.projects = this.projectsService.getActiveProjects();
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

  getBasePrice(project: Project) {
    const steps = project.steps?.filter(s => s.stepType === StepType.payment);
    return steps?.reduce((sum, step) => sum + step.price, 0) ?? 0;
  }

  changeProjectStatus(project: Project, status: ProjectStatus) {
    project.status = status;
    if (status !== ProjectStatus.active) {
      project.endDate = new Date();
    }
    if (status === ProjectStatus.finished) {
      this.animationsService.showFinishProject();
    }
    this.updateProjects([project]).subscribe(res => {
      const activeProjects = [...this.projects()]
      activeProjects.splice(this.projects().indexOf(project), 1);

      this.projectsService.getUnActiveProjects()().push(project)
      this.projects.set(activeProjects);
    });
  }

  deleteProject(project: Project) {
    if (project.id) {
      this.animationsService.changeIsloading(true);
      this.httpService.deleteProject(project.id).subscribe(res => {
        const projectIndex = this.projects().indexOf(project);
        const projects = [...this.projects()];
        projects.splice(projectIndex, 1);
        this.projects.set(projects);
        this.animationsService.changeIsloading(false);
      })
    }
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

  togglePriority(event: Event, project: Project) {
    event.stopPropagation()
    project.isPriority = !project.isPriority;
    if (project.isPriority) {
      const currentIndex = this.projects().indexOf(project);
      moveItemInArray(this.projects(), currentIndex, 0);
      this.updateProjectsPosition();
    }

    this.updateProjects(this.projects()).subscribe(res => {
      this.projects.set([...this.projects()])
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.projects(), event.previousIndex, event.currentIndex);
    this.updateProjectsPosition();
    this.updateProjects(this.projects()).subscribe(res => {
      this.projects.set([...this.projects()])
    });
  }

  updateProjectsPosition() {
    for (let index = 0; index < this.projects().length; index++) {
      this.projects()[index].positionInList = index;
    }
  }

  updateProjects(projects: Project[]) {
    this.animationsService.changeIsloading(true);
    return this.httpService.updateProjects(projects).pipe(tap(res => {
      this.animationsService.changeIsloading(false);
    }));
  }

  selectProject(project: Project) {
    this.projectsService.getCurrentProject().set(project);
    this.selectProjectEmitter.emit(project);
  }

  openProjectModal() {
    const dialogRef = this.dialog.open(NewProjectComponent);
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.animationsService.changeIsloading(true);
        this.httpService.createProject(res).subscribe(newProject => {
          this.projects.set(this.projects().concat(newProject));
          this.animationsService.changeIsloading(false);
        })
      }
    })
  }
}
