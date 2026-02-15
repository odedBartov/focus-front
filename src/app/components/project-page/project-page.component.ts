import { AfterViewInit, ChangeDetectorRef, Component, effect, ElementRef, EventEmitter, HostListener, inject, OnInit, Output, QueryList, signal, ViewChild, ViewChildren, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from '../../models/project';
import { HttpService } from '../../services/http.service';
import { CommonModule } from '@angular/common';
import { Step } from '../../models/step';
import { AnimationsService } from '../../services/animations.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NewStepComponent } from '../new-step/new-step.component';
import { paymentModelEnum, ProjectStatus, projectTypeEnum, recurringDateTypeEnum, retainerPaymentTypeEnum, StepType } from '../../models/enums';
import { ProjectModalComponent } from '../../modals/project-modal/project-modal.component';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NotesComponent } from '../notes/notes.component';
import { ProjectHoverService } from '../../services/project-hover.service';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { ProjectsService } from '../../services/projects.service';
import { AuthenticationService } from '../../services/authentication.service';
import { AutoResizeInputDirective } from '../../helpers/autoResizeInputDirective';
import { StepTask } from '../../models/stepTask';
import { AnimationItem } from 'lottie-web';
import { RetainerPayment } from '../../models/RetainerPayment';
import { HourlyWorkSession } from '../../models/hourlyWorkSession';
import { NewStepModalComponent } from '../../modals/new-step-modal/new-step-modal.component';
import { PaymentHistoryModalComponent } from '../../modals/payment-history-modal/payment-history-modal.component';
import { WorkSessionService } from '../../services/work-session.service';
import { getNextRetainerOccurrenceDate, initRetainerSteps } from '../../helpers/retainerFunctions';
import { OpenNotesComponent } from '../open-notes/open-notes.component';
import { AiChatService } from '../../services/ai-chat.service';
import { GenerateTaxDocumentComponent } from '../generate-tax-document/generate-tax-document.component';
import { ProjectSummaryComponent } from '../project-summary/project-summary.component';
import { StepManagementService } from '../../services/step-management.service';
import { taxManagementSystemEnum } from '../../models/taxSystem';

@Component({
  selector: 'app-project-page',
  imports: [CommonModule, MatDialogModule, FormsModule, MatTooltipModule, DragDropModule, NewStepComponent, NotesComponent, LottieComponent, AutoResizeInputDirective, OpenNotesComponent, GenerateTaxDocumentComponent, ProjectSummaryComponent],
  templateUrl: './project-page.component.html',
  styleUrl: './project-page.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        marginTop: '0px',
        pointerEvents: 'none'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        pointerEvents: 'auto'
      })),
      transition('collapsed <=> expanded', [
        animate('200ms ease')
      ]),
    ]),
    trigger('timerHeightTransition', [
      state('small', style({
        height: '100px'
      })),
      state('large', style({
        height: '*'
      })),
      transition('small <=> large', animate('300ms ease-in-out'))
    ])
  ]
})
export class ProjectPageComponent implements OnInit, AfterViewInit {
  route = inject(ActivatedRoute);
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  dialog = inject(MatDialog);
  projectHoverService = inject(ProjectHoverService);
  projectsService = inject(ProjectsService);
  authenticationService = inject(AuthenticationService);
  WorkSessionService = inject(WorkSessionService);
  aiChatService = inject(AiChatService);
  stepManagementService = inject(StepManagementService);
  @Output() navigateToHomeEmitter = new EventEmitter<void>();
  @ViewChild('stepsContainer', { static: false }) stepsContainer?: ElementRef;
  @ViewChild('newStepDiv', { static: false }) newStepDiv?: ElementRef;
  @ViewChild('notesDiv', { static: false }) notesDiv?: ElementRef;
  @ViewChild('addStepDiv', { static: false }) addStepDiv!: ElementRef;
  @ViewChild('generateTaxDocumentDiv', { static: false }) generateTaxDocumentDiv?: ElementRef;
  @ViewChildren('descriptions') descriptions!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('stepHeader') stepHeaders!: QueryList<ElementRef<HTMLSpanElement>>;

  projectTypeEnum = projectTypeEnum;
  paymentModelEnum = paymentModelEnum;
  recurringDateTypeEnum = recurringDateTypeEnum;
  editDiv?: HTMLDivElement;
  stepTypeEnum = StepType;
  project!: WritableSignal<Project>;
  projectId: string | null = null;
  activeStepId? = '';
  isReadOnly!: WritableSignal<boolean>;
  isShowNewStep = false;
  editStepId: string | undefined = '';
  hoverStepId? = '';
  openNotesSignal: WritableSignal<Project | undefined>;
  baseProjectPrice = 0;
  paidMoney = 0;
  lottieOptions: AnimationOptions = {
    path: '/assets/animations/stage-end.json',
    loop: false,
  };
  finishStepAnimationItem?: AnimationItem;
  animatingItemId?: string = '';
  hideProperties = this.projectHoverService.getSignal();
  animationHackFlag = true;
  mouseDownInside = false;
  openedAccordion = 1;
  retainerActiveSteps: Step[] = [];
  retainerFutureSteps: Step[] = [];
  retainerFinishedSteps: Step[] = [];
  daysInWeek = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  generateTaxDocumentId = signal<string>('');
  shouldGenerateTaxDocumentId = signal<string>('');
  shouldFinishStepAfterTaxDocument = signal<boolean>(false);

  constructor(private changeDetectorRef: ChangeDetectorRef) {
    this.openNotesSignal = this.projectsService.getProjectWithOpenNotes();
    this.project = this.projectsService.getCurrentProject();
    effect(() => {
      const value = this.project();
      //this.aiChatService.initProjectConversation(value.id);
      if (value?.steps) {
        value.steps = this.stepManagementService.sortStepsByPosition(value.steps);
        if (value.projectType === projectTypeEnum.retainer) {
          this.initRetainerSteps();
        }
      }
      this.activeStepId = this.stepManagementService.findActiveStep(value?.steps ?? [])?.id;
      this.calculatePayments();

      setTimeout(() => {
        this.setActiveStepHeight();
      }, 1);
    });
  }

  ngOnInit(): void {
    this.loadProject();
    this.isReadOnly = this.authenticationService.getIsReadOnly();
  }

  ngAfterViewInit(): void {
    this.setActiveStepHeight();
    if (this.isRetainer) {
      this.initRetainerSteps();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newStepDiv?.nativeElement && !this.newStepDiv.nativeElement.contains(event.target)) {
      this.isShowNewStep = false;
    }

    if (!this.editDiv?.contains(event.target as Node) && !this.mouseDownInside) {
      if (this.editStepId != '' && this.activeStepId === this.editStepId) {
        setTimeout(() => {
          this.setActiveStepHeight();
        }, 1);
      }
      this.editStepId = '';
    } else {
      this.mouseDownInside = true;
    }

    if (this.generateTaxDocumentDiv?.nativeElement &&
      !this.generateTaxDocumentDiv.nativeElement.contains(event.target as Node) &&
      !this.mouseDownInside) {
      this.generateTaxDocumentId.set('');
    }

    if (this.notesDiv?.nativeElement &&
      !this.notesDiv.nativeElement.contains(event.target)) {
      this.projectHoverService.projectHover();
    }

    this.mouseDownInside = false;
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
    }
  }

  get isRetainer() {
    return this.project()?.projectType === projectTypeEnum.retainer;
  }

  get isPaymentModelHourly() {
    return this.project().paymentModel === paymentModelEnum.hourly;
  }

  getProjectPrice(): number {
    if (this.isRetainer && this.project().paymentModel === paymentModelEnum.hourly) {
      const totalHours = this.project().hourlyWorkSessions.reduce((acc, session) => acc + (session.workTime / 3600000), 0);
      return Math.round(totalHours * (this.project().reccuringPayment ?? 0));
    }
    return this.baseProjectPrice;
  }

  getWeekDays(days?: number[]) {
    return days ? days.map(d => this.daysInWeek[d]).join(', ') : [];
  }

  initRetainerSteps() {
    const retainerSteps = initRetainerSteps(this.project().steps ?? []);
    this.retainerActiveSteps = retainerSteps.retainerActiveSteps;
    this.retainerFutureSteps = retainerSteps.retainerFutureSteps;
    this.retainerFinishedSteps = retainerSteps.retainerFinishedSteps;
  }

  onFinishWorkingSession(sessionData: { name: string, workTime: number, price: number }) {
    const payment = new HourlyWorkSession();
    payment.name = sessionData.name;
    payment.price = sessionData.price;
    payment.date = new Date();
    payment.workTime = sessionData.workTime;
    payment.projectId = this.project().id ?? '';

    this.calculatePayments();
    this.httpService.createHourlyWorkSession(payment).subscribe(res => {
      this.project()?.hourlyWorkSessions.push(res);
    });
  }

  onOpenProjectModal() {
    this.openProjectModal();
  }

  onOpenPaymentHistoryModal() {
    this.openPaymentHistoryModal();
  }

  finishStepAnimationCreated(animation: AnimationItem) {
    this.finishStepAnimationItem = animation;
  }

  openPaymentHistoryModal() {
    const payments = this.isPaymentModelHourly ? this.project().hourlyWorkSessions : this.project().retainerPayments;
    this.dialog.open(PaymentHistoryModalComponent, { data: { payments: payments, isPaymentModelHourly: this.isPaymentModelHourly } });
  }

  setActiveStepHeight() {
    // const element = this.descriptions.get(0)?.nativeElement as HTMLTextAreaElement;
    // if (element) {
    //   element.style.height = 'auto';
    //   element.style.height = element.scrollHeight + 'px';
    //   ;
    // }
  }

  hoverStep(stepId: string | undefined, index: number) {
    this.hoverStepId = stepId;

    const finishedSteps = this.project()?.steps.filter(s => s.isComplete).length;
    if (finishedSteps !== undefined) {
      this.setDescriptionHeight(index - finishedSteps);
    }
  }

  setDescriptionHeight(index: number) {
    const element = this.descriptions.get(index);
    if (element) {
      const currentHeight = Number.parseInt(element.nativeElement.style.height);
      const scrollHeight = element.nativeElement.scrollHeight;

      if (Number.isNaN(currentHeight) || currentHeight < scrollHeight || currentHeight > scrollHeight) {
        element.nativeElement.style.height = scrollHeight + "px";
      }
    }
  }

  clickOnAccordion(accordionNumber: number) {
    this.openedAccordion = this.openedAccordion === accordionNumber ? 0 : accordionNumber;
  }

  updateStepsPosition() {
    if (this.project()?.steps) {
      this.stepManagementService.updateStepsPositions(this.project().steps);
    }

    if (this.isRetainer) {
      this.updateRetainerStepsPositions();
    }
  }

  updateRetainerStepsPositions() {
    this.stepManagementService.updateStepsPositions(this.retainerActiveSteps);
    this.retainerActiveSteps.sort((a, b) => a.positionInList - b.positionInList);

    this.stepManagementService.updateStepsPositions(this.retainerFutureSteps);
    this.retainerFutureSteps.sort((a, b) => a.positionInList - b.positionInList);

    this.stepManagementService.updateStepsPositions(this.retainerFinishedSteps);
    this.retainerFinishedSteps.sort((a, b) => a.positionInList - b.positionInList);
  }

  adjustCdkPreviewHeight(div: any) { // this is stupid. angular is stupid
    const cdkPreview = document.getElementsByClassName("cdk-drag retainer-step-future not-finished cdk-drag-preview")[0] as any;
    cdkPreview.style.height = (div.scrollHeight + 18) + 'px';
  }

  dropStep(event: CdkDragDrop<string[]>, retainerSteps?: Step[]): void {
    if (this.project()?.steps) {
      if (this.isRetainer && retainerSteps) {
        moveItemInArray(retainerSteps, event.previousIndex, event.currentIndex);
      } else {
        moveItemInArray(this.project().steps, event.previousIndex, event.currentIndex);
      }
      this.updateStepsPosition();
      this.animationHackFlag = false;
      setTimeout(() => { // stupid angular animation
        this.animationHackFlag = true;
        this.activeStepId = this.stepManagementService.findActiveStep(this.project()?.steps ?? [])?.id;
      });

      this.animationsService.changeIsLoadingWithDelay();
      setTimeout(() => {
        this.setActiveStepHeight();
      }, 1);
      this.httpService.updateSteps(this.project().steps).subscribe(res => {
        this.animationsService.changeIsloading(false);
      })
    }
  }

  dropTask(event: CdkDragDrop<any[]>, step: Step): void {
    if (step.tasks) {
      moveItemInArray(step.tasks, event.previousIndex, event.currentIndex);
      for (let index = 0; index < step.tasks.length; index++) {
        step.tasks[index].positionInStep = index;
      }

      const tmp = step.tasks;
      step.tasks = [];
      setTimeout(() => {
        step.tasks = tmp
        this.updateStep(step);
      }, 0);
    }
  }

  loadProject(): void {
    if (this.projectId) {
      this.animationsService.changeIsloading(true);
      this.httpService.getProject(this.projectId).subscribe(res => {
        if (res.steps) {
          this.project.set(res);
          if (this.project()?.steps) {
            this.project().steps = this.stepManagementService.sortStepsByPosition(this.project().steps);
          }
          this.activeStepId = this.stepManagementService.findActiveStep(res.steps)?.id;
          this.animationsService.changeIsloading(false);
        }
      });
    }
  }

  calculatePayments(): void {
    const result = this.stepManagementService.calculateProjectPrice(
      this.project(),
      this.retainerFinishedSteps
    );
    this.baseProjectPrice = result.basePrice;
    this.paidMoney = result.paidMoney;
  }

  completeStep(step: Step) {
    if (step.stepType === StepType.payment) {
      this.shouldGenerateTaxDocumentId.set(step.id ?? '');
    } else {
      this.changeStepStatus(step);
    }
  }

  generateTaxDocument(step: Step) {
    this.shouldGenerateTaxDocumentId.set('');
    this.generateTaxDocumentId.set(step.id ?? '');
    this.shouldFinishStepAfterTaxDocument.set(true);
  }

  dontGenerateTaxDocument(step: Step) {
    this.shouldGenerateTaxDocumentId.set('');
    this.shouldFinishStepAfterTaxDocument.set(false);
    setTimeout(() => {
      this.changeStepStatus(step);
    }, 50);
  }

  changeStepStatus(step: Step): void {
    this.animatingItemId = step.isRecurring || (!step.isRecurring && !step.isComplete) ? step.id : undefined;
    this.changeDetectorRef.detectChanges(); // Ensure the view is updated before the animation starts

    setTimeout(() => {
      this.playLottieAnimation().then(() => {
        this.animatingItemId = '';

        // Use the service to handle step completion logic (mutates step and steps array)
        this.stepManagementService.completeStep(
          step,
          this.project().steps,
          this.isRetainer
        );

        // Update positions
        this.updateStepsPosition();

        // Reinitialize retainer steps if needed
        if (this.isRetainer) {
          this.initRetainerSteps();
        }

        // Update active step
        this.activeStepId = this.stepManagementService.findActiveStep(this.project().steps)?.id;

        // Update the step on the server
        this.updateStep(step);
      });
    }, 100);
  }

  updateStep(step: Step) {
    this.animationsService.changeIsLoadingWithDelay();
    this.handleRetainerPayments(step);
    this.httpService.updateSteps([step]).subscribe(res => {
      if (this.project().steps) {
        this.project().steps = this.project()?.steps?.map(step =>
          step.id === res[0].id ? res[0] : step
        )
        this.initRetainerSteps();
      }
      this.editStepId = '';
      this.calculatePayments();
      setTimeout(() => {
        this.hoverStepId = '';
        if (step.id === this.activeStepId) {
          this.setActiveStepHeight();
        }
      }, 1);
      this.animationsService.changeIsloading(false);
      if (!this.isRetainer) {
        this.isFinishProject();
      }
    })
  }

  handleRetainerPayments(step: Step) {
    if (step.isComplete && step.stepType === StepType.payment) {
      const payment = new RetainerPayment();
      payment.name = step.name ?? 'תשלום ללא שם';
      payment.price = step.price;
      payment.projectId = step.projectId ?? 'noId';
      payment.type = step.isRecurring ? retainerPaymentTypeEnum.mothly : retainerPaymentTypeEnum.oneTime;
      this.httpService.createRetainerPayment(payment).subscribe((res: RetainerPayment) => {
        this.project().retainerPayments.push(res);
      });
    } else if (!step.isRecurring) {
      // delete retainer payment?
    }
  }

  playLottieAnimation(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.finishStepAnimationItem) {
        resolve();
        return;
      }

      const onComplete = () => {
        this.finishStepAnimationItem?.removeEventListener('complete', onComplete);
        resolve();
      };

      if (!this.animatingItemId) {
        resolve();
        return;
      }
      this.finishStepAnimationItem.addEventListener('complete', onComplete);
      this.finishStepAnimationItem.play();
    });
  }

  toggleTask(step: Step, task: StepTask) {
    task.isComplete = !task.isComplete;
    this.httpService.updateSteps([step]).subscribe(res => { })
  }

  isFinishProject() {
    if (this.stepManagementService.areAllStepsComplete(this.project().steps)) {
      const updatedProject = { ...this.project() };
      updatedProject.status = ProjectStatus.finished;
      this.project.set(updatedProject);
      this.animationsService.showFinishProject();
      const activeProjects = this.projectsService.getActiveProjects();
      const unActiveProjects = this.projectsService.getUnActiveProjects();
      let activeProjectIndex = -1;
      for (let index = 0; index < activeProjects().length; index++) {
        const element = activeProjects()[index];
        if (element.id === this.project().id) {
          activeProjectIndex = index;
          break;
        }
      }
      if (activeProjectIndex > -1) {
        unActiveProjects.set(unActiveProjects().concat(this.project()));
        activeProjects().splice(activeProjectIndex, 1);
      }
      this.httpService.updateProjects([this.project()]).subscribe(res => { });
      setTimeout(() => {
        this.navigateToHomeEmitter.emit();
      }, 5000);
    }
  }

  openProjectModal() {
    const dialogRef = this.dialog.open(ProjectModalComponent, { data: { project: this.project() } });
    dialogRef.afterClosed().subscribe((res: Project) => {
      if (res) {
        this.project.set(res);
        if (res.paymentModel === paymentModelEnum.monthly) {
          const retainerStep = this.project().steps.find(s => s.stepType === StepType.payment && s.isRecurring);
          if (retainerStep) {
            retainerStep.price = res.reccuringPayment ?? 0;
            retainerStep.recurringDayInMonth = res.monthlyPaymentDay;
            this.updateStep(retainerStep);
          }
        }
      }
    });
  }

  showNewStep() {
    this.isShowNewStep = true;
    this.scrollToBottom();
  }

  showNewStepModal() {
    const remainPrice = this.getProjectPrice() - this.paidMoney;
    const dialogRef = this.dialog.open(NewStepModalComponent, { autoFocus: false, data: { paymentModel: this.project().paymentModel, defaultPrice: remainPrice } });
    const childInstance = dialogRef.componentInstance;
    childInstance.stepUpdated.subscribe(newStep => {
      this.createNewStep(newStep);
    });
  }

  createNewStep(step: Step) {
    this.animationsService.changeIsloading(true);
    step.projectId = this.project()?.id;
    step.positionInList = (this.project()?.steps?.length ?? 0) + 1;
    this.httpService.createStep(step).subscribe(res => {
      if (this.project().steps.length === 0) {
        this.activeStepId = res.id;
      }
      this.project()?.steps?.push(res);
      this.initRetainerSteps();
      this.isShowNewStep = false;
      this.calculatePayments();
      this.animationsService.changeIsloading(false);
    });
  }

  editStep(div: HTMLDivElement, stepId: string | undefined) {
    this.editDiv = div;
    this.editStepId = stepId;
  }

  openNewStepModal(step?: Step) {
    if (this.project().paymentModel === paymentModelEnum.monthly && step?.isRecurring && step.stepType === StepType.payment) {
      this.openProjectModal();
    } else {
      const dialogRef = this.dialog.open(NewStepModalComponent, { data: { step: step, isActive: true, paymentModel: this.project().paymentModel } });
      const childInstance = dialogRef.componentInstance;
      childInstance.stepUpdated.subscribe(newStep => {
        this.updateStep(newStep);
      });
    }
  }

  deleteStep(step: Step) {
    if (step.id) {
      this.animationsService.changeIsLoadingWithDelay();
      const stepIndex = this.project()?.steps?.indexOf(step);
      if (stepIndex !== undefined) {
        this.project()?.steps?.splice(stepIndex, 1);
        this.initRetainerSteps();
        this.calculatePayments();
      }
      this.httpService.deleteStep(step.id).subscribe(res => {
        this.animationsService.changeIsloading(false);
      });
    }
  }

  scrollToBottom() {
    const container = this.stepsContainer?.nativeElement;
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 1);
  }

  showGenerateTaxDocument(stepId: string) {
    this.generateTaxDocumentId.set(stepId);
  }

  taxDocumentCreated(step: Step) {
    this.animationsService.isLoading.set(true);    
    this.httpService.getStepById(step.id!).subscribe((res: Step) => {
      this.animationsService.isLoading.set(false);
      // Update the step in the project's steps array
      if (this.project().steps) {
        this.project().steps = this.project().steps.map(s =>
          s.id === res.id ? res : s
        );
      }
      setTimeout(() => {
        if (this.shouldFinishStepAfterTaxDocument()) {
          this.shouldFinishStepAfterTaxDocument.set(false);
          setTimeout(() => {
            this.changeStepStatus(res);
          }, 50);
        }
        this.generateTaxDocumentId.set('');
        this.shouldGenerateTaxDocumentId.set('');
      }, 1);
    });
  }
}
