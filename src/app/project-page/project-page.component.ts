import { Component, ElementRef, HostListener, inject, Input, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from '../models/project';
import { HttpService } from '../services/http.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Step } from '../models/step';
import { LoadingService } from '../services/loading.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../modals/confirmation-modal/confirmation-modal.component';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NewStepComponent } from '../new-step/new-step.component';
import { StepType } from '../models/enums';
import { ProjectModalComponent } from '../modals/project-modal/project-modal.component';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-project-page',
  imports: [CommonModule, MatDialogModule, FormsModule, MatTooltipModule, DragDropModule, NewStepComponent],
  templateUrl: './project-page.component.html',
  styleUrl: './project-page.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden',
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        overflow: 'hidden',
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease')
      ]),
    ])
  ]
})
export class ProjectPageComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  dialog = inject(MatDialog);
  @ViewChild('newStepDiv', { static: false }) newStepDiv?: ElementRef;
  editDiv?: HTMLDivElement;
  @Input() set projectInput(value: Project | undefined) {
    this.activeStepId = value?.steps?.find(s => !s.isComplete)?.id;
    this.project = value;
    this.calculatePaidMoney();
    if (this.project?.steps) {
      this.project.steps = this.project.steps.sort((a, b) => a.positionInList - b.positionInList);
    }
  };
  project?: Project;
  projectId: string | null = null;
  activeStepId? = '';
  isReadOnly = false;
  isShowNewStep = false;
  editStepId: string | undefined = '';
  hoverStepId? = '';
  currentSessionTime = new Date();
  workingTimeInterval: any;
  workedTimeToShow = 0;

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
      this.isReadOnly = params.get('readOnly') == 'true';
    });
  }

  ngOnInit(): void {
    this.loadProject();
    this.resetWorkingTimer();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newStepDiv?.nativeElement) {
      if (!this.newStepDiv.nativeElement.contains(event.target)) {
        this.isShowNewStep = false;
      }
    }

    if (!this.editDiv?.contains(event.target as Node)) {
      this.editStepId = '';
    }
  }

  updateStepsPosition() {
    if (this.project?.steps) {
      for (let index = 0; index < this.project?.steps.length; index++) {
        this.project.steps[index].positionInList = index;
      }
    }
  }

  dropStep(event: CdkDragDrop<string[]>) {
    if (this.project?.steps) {
      moveItemInArray(this.project.steps, event.previousIndex, event.currentIndex);
      this.updateStepsPosition();
      this.loadingService.changeIsloading(true);
      this.httpService.updateSteps(this.project.steps).subscribe(res => {
        this.loadingService.changeIsloading(false);
      })
    }
  }

  loadProject() {
    if (this.projectId) {
      this.loadingService.changeIsloading(true);
      this.httpService.getProject(this.projectId).subscribe(res => {
        if (res.steps) {
          this.project = res;
          this.activeStepId = res.steps.find(s => !s.isComplete)?.id;
          this.loadingService.changeIsloading(false);
        }
      });
    }
  }

  updateCient() {
    if (this.project) {
      this.project.updateClient = !this.project.updateClient;
    }
  }

  changeStepStatus(step: Step) {
    step.isComplete = !step.isComplete;
    if (step.isComplete) {
      step.dateCompleted = new Date();
    }
    this.updateStep(step);
  }

  updateStep(step: Step) {
    this.loadingService.changeIsloading(true);
    this.httpService.updateSteps([step]).subscribe(res => {
      if (this.project && this.project.steps) {
        this.project.steps = this.project?.steps?.map(step =>
          step.id === res[0].id ? res[0] : step
        )
      }
      this.editStepId = '';
      this.activeStepId = this.project?.steps?.find(s => !s.isComplete)?.id;
      this.calculatePaidMoney();
      this.loadingService.changeIsloading(false);
    })
  }

  // openStepModal(step?: Step) {
  //   const dialogRef = this.dialog.open(StepModalComponent, { data: { step: step, project: this.project } });

  //   dialogRef.afterClosed().subscribe(res => {
  //     if (res) { // should reload
  //       this.loadProject();
  //     }
  //   })
  // }

  openProjectModal() {
    const dialogRef = this.dialog.open(ProjectModalComponent, { data: { project: this.project } });

    dialogRef.afterClosed().subscribe(res => {
      if (res) { // should reload
        this.loadProject();
      }
    })
  }

  showNewStep() {
    this.isShowNewStep = true;
  }

  showDeleteStepModal(step: Step) {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, { data: step.name });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.deleteStep(step);
      }
    })
  }

  createNewStep(step: Step) {
    this.loadingService.changeIsloading(true);
    step.projectId = this.project?.id;
    this.httpService.createStep(step).subscribe(res => {
      this.project?.steps?.push(res);
      this.isShowNewStep = false;
      this.loadingService.changeIsloading(false);
    })
  }

  editStep(div: HTMLDivElement, stepId: string | undefined) {
    this.editDiv = div;
    this.editStepId = stepId;
  }

  deleteStep(step: Step) {
    if (step.id) {
      this.loadingService.changeIsloading(true);
      this.httpService.deleteStep(step.id).subscribe(res => {
        const stepIndex = this.project?.steps?.indexOf(step);
        if (stepIndex !== undefined) {
          this.project?.steps?.splice(stepIndex, 1);
        }
        this.loadingService.changeIsloading(false);
      });
    }
  }

  calculatePaidMoney() {
    const sum = this.project?.steps?.reduce((sum, step) => sum + ((step.isComplete && step.stepType === StepType.payment) ? step.price : 0), 0);
    if (this.project) {
      this.project.paidMoney = sum ?? 0;
    }
  }

  resetWorkingTimer() {
    const timeInterval = 60000;
    this.currentSessionTime = new Date();
    this.workedTimeToShow = this.project?.totalWorkingTime ?? 0;
    this.workingTimeInterval = setInterval(() => {
      if (this.project) {
        this.workedTimeToShow += timeInterval;
      }
    }, timeInterval);
  }

  calculateWorkingTime() {
    this.stopInterval();
    if (this.project) {
      let workedTime = 0;
      const workingHours = new Date().getTime() - this.currentSessionTime.getTime();
      if (workingHours > 21600000) { // 6 hours
        workedTime = this.project.totalWorkingTime / this.project.totalWorkingSessions;
      } else {
        workedTime = new Date().getTime() - this.currentSessionTime.getTime();
      }
      this.project.totalWorkingSessions += 1;
      this.project.totalWorkingTime += workedTime;
      this.httpService.updateProjects([this.project]).subscribe(res => {
      })
    }
  }

  stopInterval() {
    if (this.workingTimeInterval) {
      clearInterval(this.workingTimeInterval);
      this.workingTimeInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.calculateWorkingTime();
  }
}
