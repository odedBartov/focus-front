import { Component, EventEmitter, inject, Input, Output, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { ProjectStatus, StepType } from '../../models/enums';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { tap } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { NewProjectComponent } from '../../modals/new-project/new-project.component';
import { TodayTasksComponent } from "../today-tasks/today-tasks.component";
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

  getRemainingPayment(project: Project) {
    let base = 0;
    let paid = 0;
    project.steps.forEach(step => {
      if (step.stepType === StepType.payment) {
        base += step.price;
        if (step.isComplete) {
          paid += step.price;
        }
      }
    });

    return base - paid;
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
      this.animationsService.changeIsLoadingWithDelay();
      const projectIndex = this.projects().indexOf(project);
      const projects = [...this.projects()];
      projects.splice(projectIndex, 1);
      this.projects.set(projects);
      this.httpService.deleteProject(project.id).subscribe(res => {
        this.animationsService.changeIsloading(false);
      })
    }
  }

  cloneProject(project: Project) {
    this.animationsService.changeIsLoadingWithDelay();
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
    this.animationsService.changeIsLoadingWithDelay();
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
        this.animationsService.changeIsLoadingWithDelay();
        this.httpService.createProject(res).subscribe(newProject => {
          this.projects.set(this.projects().concat(newProject));
          this.animationsService.changeIsloading(false);
          setTimeout(() => {
            this.selectProject(newProject);
          }, 1);
        })
      }
    })
  }

  openMenu(event: MouseEvent, menuTrigger: MatMenuTrigger, anchor: HTMLElement) {
    event.preventDefault();
    event.stopPropagation();

    // Move anchor to cursor
    anchor.style.top = `${event.clientY}px`;
    anchor.style.left = `${event.clientX}px`;

    // Open menu from anchor
    menuTrigger.openMenu();
    menuTrigger.menu?.focusFirstItem('mouse');
  }
}
