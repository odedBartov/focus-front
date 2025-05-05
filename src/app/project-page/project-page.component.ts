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
  @Input() set projectInput(value: Project | undefined) {
    this.project.set(value);
  }
  project = signal<Project | undefined>(undefined);
  projectId: string | null = null;
  activeStepId? = '';
  isReadOnly = false;
  isShowNewStep = false;
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
      const clickedInside = this.newStepDiv.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.isShowNewStep = false;
      }
    }
  }

  loadProject() {
    if (this.projectId) {
      this.loadingService.changeIsloading(true);
      this.httpService.getProject(this.projectId).subscribe(res => {
        if (res.steps) {
          this.project.set(res);
          // todo: find active step
          this.activeStepId = res.steps[1].id;
          this.loadingService.changeIsloading(false);
        }
      });
    }
  }

  updateCient() {
    this.project.update(current => ({ ...current, updateClient: !current?.updateClient } as Project));
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
    this.httpService.updateStep(step).subscribe({
      next: (res: Step) => {
        step = res;
        this.loadingService.changeIsloading(false);
      }, error: (err) => {
        this.loadingService.changeIsloading(false);
      }
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
    step.projectId = this.project()?.id;
    this.httpService.createStep(step).subscribe(res => {
      this.project()?.steps?.push(res);
      this.isShowNewStep = false;
      this.loadingService.changeIsloading(false);
    })
  }

  deleteStep(step: Step) {
    if (step.id) {
      this.loadingService.changeIsloading(true);
      this.httpService.deleteStep(step.id).subscribe(res => {
        const stepIndex = this.project()?.steps?.indexOf(step);
        if (stepIndex !== undefined) {
          this.project()?.steps?.splice(stepIndex, 1);
        }
        this.loadingService.changeIsloading(false);
      });
    }
  }

  calculatePrice() {
    return this.project()?.steps?.filter(s => s.isComplete).reduce((sum, item) => sum + item.price, 0);
  }
}
