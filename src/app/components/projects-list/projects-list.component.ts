import { Component, effect, EventEmitter, inject, Input, OnInit, Output, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { paymentModelEnum, ProjectStatus, projectTypeEnum, recurringDateTypeEnum, StepType, subscriptionEnum } from '../../models/enums';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { tap } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { NewProjectComponent } from '../../modals/new-project/new-project.component';
import { ProjectsService } from '../../services/projects.service';
import { AuthenticationService } from '../../services/authentication.service';
import { PaidFeatureModalComponent } from '../../modals/paid-feature-modal/paid-feature-modal.component';
import { Step } from '../../models/step';
import { getTodayAtMidnightLocal } from '../../helpers/functions';
import { getNextRetainerOccurrenceDate } from '../../helpers/retainerFunctions';

@Component({
  selector: 'app-projects-list',
  imports: [CommonModule, MatProgressBarModule, MatMenuModule, DragDropModule, MatTooltipModule],
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss'
})
export class ProjectsListComponent implements OnInit {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  projectsService = inject(ProjectsService);
  authenticationService = inject(AuthenticationService);
  dialog = inject(MatDialog);
  @Output() selectProjectEmitter = new EventEmitter<Project>();
  projects: WritableSignal<Project[]>;
  filteredProjects: Project[] = [];
  router = inject(Router);
  projectStatusEnum = ProjectStatus;
  projectTypeEnum = projectTypeEnum;
  projectsFilter: WritableSignal<projectTypeEnum | undefined>;
  userSubscription = subscriptionEnum.free;

  constructor() {
    this.projects = this.projectsService.getActiveProjects();
    this.projectsFilter = this.projectsService.currentProjectFilter;
    this.filterProjects(this.projectsFilter());

    effect(() => {
      this.filteredProjects = [...this.projects()];
      this.filterProjects(this.projectsFilter());
    });
  }

  ngOnInit() {
    this.userSubscription = this.authenticationService.getSubscription();
  }

  filterProjects(filterType?: projectTypeEnum) {
    this.projectsFilter.set(filterType);
    var filterLambda = (p: Project) => true;

    if (filterType === projectTypeEnum.proccess) {
      filterLambda = (p: Project) => p.projectType == undefined || p.projectType === projectTypeEnum.proccess;
    } else if (filterType === projectTypeEnum.retainer) {
      filterLambda = (p: Project) => p.projectType === projectTypeEnum.retainer;
    }

    this.filteredProjects = this.projects().filter(filterLambda);
    this.sortFilteredProjects();
  }

  sortFilteredProjects() {
    this.filteredProjects.sort((a, b) => (a.positionInList ?? 0) - (b.positionInList ?? 0));
  }

  getCurrentStep(project: Project) {
    return project.steps?.find(s => !s.isComplete);
  }

  getProjectProgress(project: Project) {
    const completedSteps = project.steps?.filter(s => s.isComplete).length;
    return ((completedSteps ?? 0) / (project.steps?.length > 0 ? project.steps.length : 1)) * 100;
  }

  areThereOpenSteps(project: Project) {
    return project.steps?.some(s => !s.isComplete);
  }

  getRemainingPayment(project: Project) {
    let base = 0;
    let paid = 0;
    if (project.projectType === projectTypeEnum.retainer && project.paymentModel === paymentModelEnum.hourly) {
      base = project.hourlyWorkSessions.reduce((sum, ws) => sum + ws.price, 0);
      paid = project.steps.filter(s => (s.stepType === StepType.payment && s.isComplete)).reduce((sum, step) => sum + step.price, 0);
    } else {
      project.steps.forEach(step => {
        if (step.stepType === StepType.payment) {
          base += step.price;
          if (step.isComplete) {
            paid += step.price;
          }
        }
      });
    }

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
    moveItemInArray(this.filteredProjects, event.previousIndex, event.currentIndex);
    this.updateProjectsPosition();
    this.projects.set([...this.projects()]);
    this.updateProjects(this.projects()).subscribe();
  }

  updateProjectsPosition() {
    for (let index = 0; index < this.filteredProjects.length; index++) {
      this.filteredProjects[index].positionInList = index;
      const project = this.projects().find(p => p.id === this.filteredProjects[index].id);
      if (project) {
        project.positionInList = index;
      }
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
    const maxProjects = this.userSubscription == subscriptionEnum.free ? 1 : (this.userSubscription == subscriptionEnum.partial ? 3 : -1);
    if (maxProjects > -1 && maxProjects <= this.projects().length) {      
      this.dialog.open(PaidFeatureModalComponent, { data: { subscription:  this.userSubscription === subscriptionEnum.partial? subscriptionEnum.full : subscriptionEnum.free} });
    } else {
      const dialogRef = this.dialog.open(NewProjectComponent);
      dialogRef.afterClosed().subscribe(res => {
        if (res) {
          this.animationsService.changeIsloading(true);
          this.httpService.createProject(res).subscribe(newProject => {
            this.projects.set(this.projects().concat(newProject));
            if (newProject.projectType === projectTypeEnum.retainer && newProject.paymentModel === paymentModelEnum.monthly && newProject.reccuringPayment && newProject.monthlyPaymentDay) {
              const newStep = new Step();
              newStep.isRecurring = true;
              newStep.name = "תשלום חודשי";
              newStep.price = newProject.reccuringPayment ?? 0;
              newStep.projectId = newProject.id;
              newStep.recurringDateType = recurringDateTypeEnum.month;
              newStep.recurringDayInMonth = newProject.monthlyPaymentDay;
              newStep.recurringEvery = 1;
              newStep.stepType = StepType.payment;
              newStep.dateDue = new Date();
              const nextOccurrence = getTodayAtMidnightLocal();
              if (newProject.monthlyPaymentDay !== new Date().getDate()) {
                nextOccurrence.setDate(newProject.monthlyPaymentDay);
                nextOccurrence.setMonth(nextOccurrence.getMonth() + newStep.recurringEvery-1);
              }
              newStep.dateOnWeekly = nextOccurrence;
              newStep.nextOccurrence = getNextRetainerOccurrenceDate(newStep);
              this.httpService.createStep(newStep).subscribe(res => {
                newProject.steps.push(res);
                setTimeout(() => {
                  this.animationsService.changeIsloading(false);
                  this.selectProject(newProject);
                }, 1);
              });
            } else {
              setTimeout(() => {
                this.animationsService.changeIsloading(false);
                this.selectProject(newProject);
              }, 1);
            }
          })
        }
      })
    }
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
