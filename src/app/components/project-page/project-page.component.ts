import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, inject, Input, OnInit, Output, QueryList, ViewChild, ViewChildren, viewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from '../../models/project';
import { HttpService } from '../../services/http.service';
import { CommonModule } from '@angular/common';
import { Step } from '../../models/step';
import { AnimationsService } from '../../services/animations.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../../modals/confirmation-modal/confirmation-modal.component';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NewStepComponent } from '../new-step/new-step.component';
import { StepType } from '../../models/enums';
import { ProjectModalComponent } from '../../modals/project-modal/project-modal.component';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NotesComponent } from '../notes/notes.component';
import { ProjectHoverService } from '../../services/project-hover.service';
import { RichTextComponent } from "../rich-text/rich-text.component";
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';

@Component({
  selector: 'app-project-page',
  imports: [CommonModule, MatDialogModule, FormsModule, MatTooltipModule, DragDropModule, NewStepComponent, NotesComponent, RichTextComponent, LottieComponent],
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
export class ProjectPageComponent implements OnInit, AfterViewInit {
  route = inject(ActivatedRoute);
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  dialog = inject(MatDialog);
  projectHoverService = inject(ProjectHoverService);
  @ViewChild('newStepDiv', { static: false }) newStepDiv?: ElementRef;
  @ViewChild('notesDiv', { static: false }) notesDiv?: ElementRef;
  @ViewChild('richTextDiv', { static: false }) richTextDiv?: ElementRef;
  @ViewChild('addStepDiv', { static: false }) addStepDiv!: ElementRef;
  @ViewChildren('descriptions') descriptions!: QueryList<ElementRef<HTMLTextAreaElement>>;
  editDiv?: HTMLDivElement;
  @Output() projectUpdated = new EventEmitter<Project>();
  @Input() set projectInput(value: Project | undefined) {
    this.project = value;
    if (this.project?.steps) {
      this.project.steps = this.project.steps.sort((a, b) => a.positionInList - b.positionInList);
    }

    this.activeStepId = this.project?.steps?.find(s => !s.isComplete)?.id;
    this.calculatePayments();
  };
  stepTypeEnum = StepType;
  project?: Project;
  projectId: string | null = null;
  activeStepId? = '';
  isReadOnly = false;
  isShowNewStep = false;
  editStepId: string | undefined = '';
  hoverStepId? = '';
  showNotes = false;
  baseProjectPrice = 0;
  paidMoney = 0;
  lottieOptions: AnimationOptions = {
    path: '/assets/animations/step-end.json',
    loop: false,
  };
  animatingItemId: string = '';
  hideProperties = this.projectHoverService.getSignal();
  animationHackFlag = true;
  constructor(private changeDetectorRef: ChangeDetectorRef) {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
      this.isReadOnly = params.get('readOnly') == 'true';
    });
  }

  ngAfterViewInit(): void {
    this.setActiveStepHeight();
  }

  ngOnInit(): void {
    this.loadProject();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newStepDiv?.nativeElement && !this.newStepDiv.nativeElement.contains(event.target)) {
      this.isShowNewStep = false;
    }

    if (!this.editDiv?.contains(event.target as Node)) {
      this.editStepId = '';
    }

    if (this.notesDiv?.nativeElement &&
      !this.notesDiv.nativeElement.contains(event.target) &&
      !this.richTextDiv?.nativeElement.contains(event.target)) {
      this.showNotes = false;
      this.projectHoverService.projectHover();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    const isSpace = event.code === 'Space' || event.key === ' ';

    if (isSpace && this.addStepDiv?.nativeElement) {
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.hasAttribute('contenteditable')
      )) {
        return;
      }
      this.addStepDiv.nativeElement.focus();
    } else {
      const isEnter = event.code === 'Enter' || event.key === 'Enter';
      // if (isEnter) {
      //   const active = document.activeElement as HTMLElement;
      //   if (active) {
      //     active.click();
      //   }
      // }
    }
  }

  setActiveStepHeight() {
    this.setDescriptionHeight(0);
  }

  hoverStep(stepId: string | undefined, index: number) {
    this.hoverStepId = stepId;

    const finishedSteps = this.project?.steps.filter(s => s.isComplete).length;
    if (finishedSteps !== undefined) {
      this.setDescriptionHeight(index - finishedSteps);
    }
  }

  setDescriptionHeight(index: number) {
    const element = this.descriptions.get(index);
    if (element) {
      element.nativeElement.style.height = element.nativeElement.scrollHeight + "px";
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
      this.animationHackFlag = false;
      setTimeout(() => { // stupid angular animation
        this.animationHackFlag = true;
        this.activeStepId = this.project?.steps?.find(s => !s.isComplete)?.id;
      });

      this.animationsService.changeIsloading(true);
      this.httpService.updateSteps(this.project.steps).subscribe(res => {
        this.setActiveStepHeight();
        this.animationsService.changeIsloading(false);
      })
    }
  }

  loadProject() {
    if (this.projectId) {
      this.animationsService.changeIsloading(true);
      this.httpService.getProject(this.projectId).subscribe(res => {
        if (res.steps) {
          this.project = res;
          if (this.project?.steps) {
            this.project.steps = this.project.steps.sort((a, b) => a.positionInList - b.positionInList);
          }
          this.activeStepId = res.steps.find(s => !s.isComplete)?.id;
          this.animationsService.changeIsloading(false);
        }
      });
    }
  }

  calculatePayments() {
    this.baseProjectPrice = 0;
    this.paidMoney = 0;
    this.project?.steps?.forEach(step => {
      if (step.stepType === StepType.payment) {
        this.baseProjectPrice += step.price;
        if (step.isComplete) {
          this.paidMoney += step.price;
        }
      }
    });
  }

  updateCient() {
    if (this.project) {
      this.project.updateClient = !this.project.updateClient;
    }
  }

  changeStepStatus(step: Step, animation?: LottieComponent) {
    step.isComplete = !step.isComplete;
    if (step.isComplete) {
      step.dateCompleted = new Date();
    } else {
      step.dateCompleted = undefined;
    }

    this.updateStep(step);
  }

  updateStep(step: Step) {
    this.animationsService.changeIsloading(true);
    this.httpService.updateSteps([step]).subscribe(res => {
      if (this.project && this.project.steps) {
        this.project.steps = this.project?.steps?.map(step =>
          step.id === res[0].id ? res[0] : step
        )
      }
      this.editStepId = '';
      this.activeStepId = this.project?.steps?.find(s => !s.isComplete)?.id;
      this.calculatePayments();
      setTimeout(() => {
        this.setActiveStepHeight();
      }, 1);
      this.animationsService.changeIsloading(false);
      this.isFinishProject();
    })
  }

  isFinishProject() {
    const stepsInProgress = this.project?.steps.filter(s => !s.isComplete).length;
    if (stepsInProgress === 0) {
      this.animationsService.showFinishProject();
    }
  }

  openProjectModal() {
    const dialogRef = this.dialog.open(ProjectModalComponent, { data: { project: this.project } });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.project = res;
        this.projectUpdated.emit(res);
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
    this.animationsService.changeIsloading(true);
    step.projectId = this.project?.id;
    step.positionInList = (this.project?.steps?.length ?? 0) + 1;
    this.httpService.createStep(step).subscribe(res => {
      this.project?.steps?.push(res);
      this.isShowNewStep = false;
      this.calculatePayments();
      this.animationsService.changeIsloading(false);
    })
  }

  editStep(div: HTMLDivElement, stepId: string | undefined) {
    this.editDiv = div;
    this.editStepId = stepId;
  }

  deleteStep(step: Step) {
    if (step.id) {
      this.animationsService.changeIsloading(true);
      this.httpService.deleteStep(step.id).subscribe(res => {
        const stepIndex = this.project?.steps?.indexOf(step);
        if (stepIndex !== undefined) {
          this.calculatePayments();
          this.project?.steps?.splice(stepIndex, 1);
        }
        this.animationsService.changeIsloading(false);
      });
    }
  }

  showNotesPopup(show: boolean) {
    this.showNotes = show;
    this.projectHoverService.projectHover('empty');
  }
}
