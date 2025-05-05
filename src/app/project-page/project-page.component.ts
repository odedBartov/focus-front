import { Component, ElementRef, HostListener, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from '../models/project';
import { HttpService } from '../services/http.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Step } from '../models/step';
import { LoadingService } from '../services/loading.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StepModalComponent } from '../modals/step-modal/step-modal.component';
import { ConfirmationModalComponent } from '../modals/confirmation-modal/confirmation-modal.component';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NewStepComponent } from '../new-step/new-step.component';
import { reduce } from 'rxjs';
import { StepType } from '../models/enums';

@Component({
  selector: 'app-project-page',
  imports: [CommonModule, MatDialogModule, FormsModule, MatTooltipModule, NewStepComponent],
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
export class ProjectPageComponent implements OnInit {
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
  };
  project?: Project;
  projectId: string | null = null;
  activeStepId? = '';
  isReadOnly = false;
  isShowNewStep = false;
  editStepId: string | undefined = '';
  hoverStepId? = '';

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
      this.isReadOnly = params.get('readOnly') == 'true';

    });
  }

  ngOnInit(): void {
    this.loadProject();
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
    this.httpService.updateStep(step).subscribe(res => {
      if (this.project && this.project.steps) {
        this.project.steps = this.project?.steps?.map(step =>
          step.id === res.id ? res : step
        )
      }
      this.editStepId = '';
      this.activeStepId = this.project?.steps?.find(s => !s.isComplete)?.id;
      this.calculatePaidMoney();
      this.loadingService.changeIsloading(false);
    })
  }

  // openStepModal(step?: Step) {
  //   const dialogRef = this.dialog.open(StepModalComponent, { data: { step: step, project: this.project() } });

  //   dialogRef.afterClosed().subscribe(res => {
  //     if (res) { // should reload
  //       this.loadProject();
  //     }
  //   })
  // }

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
}
