import {
  AfterViewInit, ChangeDetectorRef, Component, effect, ElementRef, EventEmitter,
  HostListener, inject, OnInit, Output, QueryList, signal, ViewChild, ViewChildren, WritableSignal
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';

import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { ProjectHoverService } from '../../services/project-hover.service';
import { ProjectsService } from '../../services/projects.service';
import { AuthenticationService } from '../../services/authentication.service';
import { WorkSessionService } from '../../services/work-session.service';
import { AiChatService } from '../../services/ai-chat.service';
import { StepManagementService } from '../../services/step-management.service';

import { Project } from '../../models/project';
import { Step } from '../../models/step';
import { StepTask } from '../../models/stepTask';
import { RetainerPayment } from '../../models/RetainerPayment';
import { HourlyWorkSession } from '../../models/hourlyWorkSession';
import { paymentModelEnum, ProjectStatus, projectTypeEnum, recurringDateTypeEnum, retainerPaymentTypeEnum, StepType } from '../../models/enums';
import { taxManagementSystemEnum } from '../../models/taxSystem';

import { ProjectModalComponent } from '../../modals/project-modal/project-modal.component';
import { NewStepModalComponent } from '../../modals/new-step-modal/new-step-modal.component';
import { PaymentHistoryModalComponent } from '../../modals/payment-history-modal/payment-history-modal.component';

import { NewStepComponent } from '../new-step/new-step.component';
import { NotesComponent } from '../notes/notes.component';
import { OpenNotesComponent } from '../open-notes/open-notes.component';
import { GenerateTaxDocumentComponent } from '../generate-tax-document/generate-tax-document.component';
import { ProjectSummaryComponent } from '../project-summary/project-summary.component';

import { AutoResizeInputDirective } from '../../helpers/autoResizeInputDirective';
import { initRetainerSteps } from '../../helpers/retainerFunctions';
import { areDatesEqualYearAndMonth } from '../../helpers/functions';

type TaxDocumentFlow = { stepId: string; phase: 'prompt' | 'form'; finishAfter: boolean } | null;

@Component({
  selector: 'app-project-page',
  imports: [
    CommonModule, MatDialogModule, FormsModule, MatTooltipModule, DragDropModule,
    NewStepComponent, NotesComponent, LottieComponent, AutoResizeInputDirective,
    OpenNotesComponent, GenerateTaxDocumentComponent, ProjectSummaryComponent,
  ],
  templateUrl: './project-page.component.html',
  styleUrl: './project-page.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0px', opacity: 0, marginTop: '0px', pointerEvents: 'none' })),
      state('expanded', style({ height: '*', opacity: 1, pointerEvents: 'auto' })),
      transition('collapsed <=> expanded', animate('200ms ease')),
    ]),
    trigger('timerHeightTransition', [
      state('small', style({ height: '100px' })),
      state('large', style({ height: '*' })),
      transition('small <=> large', animate('300ms ease-in-out')),
    ]),
  ],
})
export class ProjectPageComponent implements OnInit, AfterViewInit {

  // --- Services ---
  readonly route = inject(ActivatedRoute);
  readonly httpService = inject(HttpService);
  readonly animationsService = inject(AnimationsService);
  readonly dialog = inject(MatDialog);
  readonly projectHoverService = inject(ProjectHoverService);
  readonly projectsService = inject(ProjectsService);
  readonly authenticationService = inject(AuthenticationService);
  readonly workSessionService = inject(WorkSessionService);
  readonly aiChatService = inject(AiChatService);
  readonly stepManagementService = inject(StepManagementService);

  // --- Outputs & View References ---
  @Output() navigateToHomeEmitter = new EventEmitter<void>();
  @ViewChild('stepsContainer', { static: false }) stepsContainer?: ElementRef;
  @ViewChild('newStepDiv', { static: false }) newStepDiv?: ElementRef;
  @ViewChild('notesDiv', { static: false }) notesDiv?: ElementRef;
  @ViewChild('addStepDiv', { static: false }) addStepDiv!: ElementRef;
  @ViewChild('generateTaxDocumentDiv', { static: false }) generateTaxDocumentDiv?: ElementRef;
  @ViewChildren('descriptions') descriptions!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('stepHeader') stepHeaders!: QueryList<ElementRef<HTMLSpanElement>>;

  // --- Enum References (used in template) ---
  readonly projectTypeEnum = projectTypeEnum;
  readonly paymentModelEnum = paymentModelEnum;
  readonly recurringDateTypeEnum = recurringDateTypeEnum;
  readonly stepTypeEnum = StepType;

  // --- Project State ---
  project!: WritableSignal<Project>;
  projectId: string | null = null;
  isReadOnly!: WritableSignal<boolean>;
  openNotesSignal: WritableSignal<Project | undefined>;
  activeStepId?: string = '';
  baseProjectPrice = 0;
  paidMoney = 0;
  taxDocumentState = signal<TaxDocumentFlow>(null);

  // --- Retainer State ---
  retainerActiveSteps: Step[] = [];
  retainerFutureSteps: Step[] = [];
  retainerFinishedSteps: Step[] = [];

  // --- UI State ---
  editDiv?: HTMLDivElement;
  editStepId: string | undefined = '';
  hoverStepId?: string = '';
  isShowNewStep = false;
  openedAccordion = 1;
  mouseDownInside = false;
  animationHackFlag = true;
  hideProperties = this.projectHoverService.getSignal();

  // --- Animation ---
  readonly lottieOptions: AnimationOptions = { path: '/assets/animations/stage-end.json', loop: false };
  finishStepAnimationItem?: AnimationItem;
  animatingItemId?: string = '';

  readonly daysInWeek = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  constructor(private changeDetectorRef: ChangeDetectorRef) {
    this.openNotesSignal = this.projectsService.getProjectWithOpenNotes();
    this.project = this.projectsService.getCurrentProject();
    effect(() => {
      const value = this.project();
      if (value?.steps) {
        value.steps = this.stepManagementService.sortStepsByPosition(value.steps);
        if (value.projectType === projectTypeEnum.retainer) {
          this.initRetainerSteps();
        }
      }
      this.activeStepId = this.stepManagementService.findActiveStep(value?.steps ?? [])?.id;
      this.calculatePayments();
    });
  }

  ngOnInit(): void {
    this.loadProject();
    this.isReadOnly = this.authenticationService.getIsReadOnly();
  }

  ngAfterViewInit(): void {
    if (this.isRetainer) {
      this.initRetainerSteps();
    }
  }

  // --- Host Listeners ---

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newStepDiv?.nativeElement && !this.newStepDiv.nativeElement.contains(event.target)) {
      this.isShowNewStep = false;
    }

    if (!this.editDiv?.contains(event.target as Node) && !this.mouseDownInside) {
      this.editStepId = '';
    } else {
      this.mouseDownInside = true;
    }

    if (this.generateTaxDocumentDiv?.nativeElement &&
      !this.generateTaxDocumentDiv.nativeElement.contains(event.target as Node) &&
      !this.mouseDownInside) {
      this.taxDocumentState.set(null);
    }

    if (this.notesDiv?.nativeElement && !this.notesDiv.nativeElement.contains(event.target)) {
      this.projectHoverService.projectHover();
    }

    this.mouseDownInside = false;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    const isSpace = event.code === 'Space' || event.key === ' ';
    if (!isSpace || !this.addStepDiv?.nativeElement) return;

    const activeElement = document.activeElement;
    const isTypingContext = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.hasAttribute('contenteditable')
    );
    if (!isTypingContext) {
      this.addStepDiv.nativeElement.focus();
    }
  }

  // --- Getters ---

  get isRetainer(): boolean {
    return this.project()?.projectType === projectTypeEnum.retainer;
  }

  get isPaymentModelHourly(): boolean {
    return this.project().paymentModel === paymentModelEnum.hourly;
  }

  // --- Template Class Helpers ---

  getStepClasses(step: Step): { [key: string]: boolean } {
    return {
      'step': this.editStepId !== step.id,
      'active-step': step.id === this.activeStepId && step.id !== this.editStepId,
      'finished': step.isComplete,
      'not-finished': !step.isComplete && (this.hoverStepId === step.id || this.isInTaxDocumentFlow(step.id)),
    };
  }

  getStepHeaderClasses(step: Step): { [key: string]: boolean } {
    return {
      'step-header': true,
      'active': !step.isComplete && step.id === this.activeStepId,
      'future': this.isInTaxDocumentFlow(step.id) ||
        (!step.isComplete && step.id !== this.activeStepId && this.hoverStepId === step.id),
    };
  }

  // --- Project Methods ---

  loadProject(): void {
    if (!this.projectId) return;
    this.animationsService.changeIsloading(true);
    this.httpService.getProject(this.projectId).subscribe(res => {
      if (res.steps) {
        this.project.set(res);
        this.project().steps = this.stepManagementService.sortStepsByPosition(this.project().steps);
        this.activeStepId = this.stepManagementService.findActiveStep(res.steps)?.id;
        this.animationsService.changeIsloading(false);
      }
    });
  }

  getProjectPrice(): number {
    if (this.isRetainer && this.isPaymentModelHourly) {
      const totalHours = this.project().hourlyWorkSessions
        .reduce((acc, session) => acc + (session.workTime / 3600000), 0);
      return Math.round(totalHours * (this.project().reccuringPayment ?? 0));
    }
    return this.baseProjectPrice;
  }

  calculatePayments(): void {
    const result = this.stepManagementService.calculateProjectPrice(this.project(), this.retainerFinishedSteps);
    this.baseProjectPrice = result.basePrice;
    this.paidMoney = result.paidMoney;
  }

  openProjectModal() {
    const dialogRef = this.dialog.open(ProjectModalComponent, { data: { project: this.project() } });
    dialogRef.afterClosed().subscribe((res: Project) => {
      if (!res) return;
      this.project.set(res);
      if (res.paymentModel === paymentModelEnum.monthly) {
        const retainerStep = this.project().steps.find(s => s.stepType === StepType.payment && s.isRecurring);
        if (retainerStep) {
          retainerStep.price = res.reccuringPayment ?? 0;
          retainerStep.recurringDayInMonth = res.monthlyPaymentDay;
          this.updateStep(retainerStep);
        }
      }
    });
  }

  openPaymentHistoryModal() {
    const payments = this.isPaymentModelHourly
      ? this.project().hourlyWorkSessions
      : this.project().retainerPayments;
    const dialogRef = this.dialog.open(PaymentHistoryModalComponent, { data: { payments, isPaymentModelHourly: this.isPaymentModelHourly } });
    dialogRef.afterClosed().subscribe(() => {
      this.calculatePayments();
    });
  }

  isFinishProject() {
    if (!this.stepManagementService.areAllStepsComplete(this.project().steps)) return;

    this.project.set({ ...this.project(), status: ProjectStatus.finished });
    this.animationsService.showFinishProject();

    const activeProjects = this.projectsService.getActiveProjects();
    const unActiveProjects = this.projectsService.getUnActiveProjects();
    const activeProjectIndex = activeProjects().findIndex(p => p.id === this.project().id);

    if (activeProjectIndex > -1) {
      unActiveProjects.set(unActiveProjects().concat(this.project()));
      activeProjects().splice(activeProjectIndex, 1);
    }

    this.httpService.updateProjects([this.project()]).subscribe();
    setTimeout(() => this.navigateToHomeEmitter.emit(), 5000);
  }

  onFinishWorkingSession(sessionData: { name: string; workTime: number; price: number }) {
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

  // --- Step Methods ---

  updateStep(step: Step) {
    this.animationsService.changeIsloading(true);
    this.handleRetainerPayments(step);
    this.httpService.updateSteps([step]).subscribe(res => {
      if (step.isRecurring) {
        this.projectsService.deleteStepsFromProject(step.createdStepsFromRetainer ?? [], this.project().id ?? '');
        this.getRetainerStepsAndUpdate();
        this.animationsService.changeIsloading(false);
      } else {
        this.animationsService.changeIsloading(false);
      }
      if (this.project().steps) {
        this.project().steps = this.project().steps.map(s => s.id === res[0].id ? res[0] : s);
        this.initRetainerSteps();
      }
      this.editStepId = '';
      this.calculatePayments();
      setTimeout(() => { this.hoverStepId = ''; }, 1);
      if (!this.isRetainer) {
        this.isFinishProject();
      }
    });
  }

  createNewStep(step: Step) {
    this.animationsService.changeIsloading(true);
    step.projectId = this.project()?.id;
    step.positionInList = (this.project()?.steps?.length ?? 0) + 1;
    this.httpService.createStep(step).subscribe(res => {
      if (step.isRecurring) {
        this.getRetainerStepsAndUpdate();
      } else {
        this.projectsService.addStepsToActiveProjects([res]);
        this.animationsService.changeIsloading(false);
      }
      if (this.project().steps.length === 0) {
        this.activeStepId = res.id;
      }
      if (!step.isRecurring) {
        const proj = this.projectsService.getCurrentProject()();
        if (proj?.id === this.project()?.id && proj.steps?.some(s => s.id === res.id)) {
          this.project.set(proj);
        } else {
          this.project()?.steps?.push(res);
        }
      } else {
        this.project()?.steps?.push(res);
      }
      this.isShowNewStep = false;
      this.calculatePayments();
    });
  }

  deleteStep(step: Step) {
    const { id: stepId, projectId } = step;
    if (!stepId || !projectId) return;

    this.animationsService.changeIsloading(true);
    this.httpService.deleteStep(stepId).subscribe(() => {
      const idsToRemove: string[] = step.isRecurring && step.createdStepsFromRetainer?.length
        ? [stepId, ...step.createdStepsFromRetainer].filter((id): id is string => typeof id === 'string')
        : [stepId];
      const idsSet = new Set(idsToRemove.map(id => String(id)));

      this.projectsService.deleteStepsFromProject(idsToRemove, projectId);
      if (step.originalRetainerStepId) {
        this.project().steps = this.project().steps.filter(s => s.id !== step.originalRetainerStepId);
      }

      const current = this.project();
      if (current?.id === projectId && current.steps) {
        const nextSteps = current.steps.filter(s => s.id != null && !idsSet.has(String(s.id)));
        this.projectsService.getCurrentProject().set({ ...current, steps: nextSteps });
        this.changeDetectorRef.detectChanges();
      }

      this.initRetainerSteps();
      this.calculatePayments();
      this.animationsService.changeIsloading(false);
    });
  }

  completeStep(step: Step) {
    const hasRelatedDocuments = step.relatedDocuments
      ? Object.values(step.relatedDocuments).some(Boolean)
      : false;

    if (step.stepType === StepType.payment && !hasRelatedDocuments) {
      this.taxDocumentState.set({ stepId: step.id ?? '', phase: 'prompt', finishAfter: false });
    } else {
      this.changeStepStatus(step);
    }
  }

  changeStepStatus(step: Step): void {
    this.finishStepAnimationItem = undefined;
    this.animatingItemId = step.isRecurring || (!step.isRecurring && !step.isComplete) ? step.id : undefined;
    this.changeDetectorRef.detectChanges();

    setTimeout(() => {
      this.playLottieAnimation().then(() => {
        this.animatingItemId = '';
        this.stepManagementService.completeStep(step, this.project().steps, this.isRetainer);
        this.updateStepsPosition();
        if (this.isRetainer) {
          this.initRetainerSteps();
        }
        this.activeStepId = this.stepManagementService.findActiveStep(this.project().steps)?.id;
        this.updateStep(step);
      });
    }, 100);
  }

  editStep(div: HTMLDivElement, stepId: string | undefined) {
    this.editDiv = div;
    this.editStepId = stepId;
  }

  toggleTask(step: Step, task: StepTask) {
    task.isComplete = !task.isComplete;
    this.httpService.updateSteps([step]).subscribe();
  }

  handleRetainerPayments(step: Step) {
    if (!step.isComplete || step.stepType !== StepType.payment) return;

    const payment = new RetainerPayment();
    payment.name = step.name ?? 'תשלום ללא שם';
    payment.price = step.price;
    payment.projectId = step.projectId ?? 'noId';
    payment.type = step.isRecurring ? retainerPaymentTypeEnum.mothly : retainerPaymentTypeEnum.oneTime;
    this.httpService.createRetainerPayment(payment).subscribe((res: RetainerPayment) => {
      this.project().retainerPayments.push(res);
    });
  }

  isStepReadOnly(step: Step): boolean {
    return step.relatedDocuments ? Object.values(step.relatedDocuments).some(Boolean) : false;
  }

  // --- Step Modals ---

  showNewStep() {
    this.isShowNewStep = true;
    this.scrollToBottom();
  }

  showNewStepModal() {
    const remainPrice = this.getProjectPrice() - this.paidMoney;
    const dialogRef = this.dialog.open(NewStepModalComponent, {
      autoFocus: false,
      data: { paymentModel: this.project().paymentModel, defaultPrice: remainPrice },
    });
    dialogRef.componentInstance.stepUpdated.subscribe(newStep => this.createNewStep(newStep));
  }

  openNewStepModal(step?: Step) {
    if (this.project().paymentModel === paymentModelEnum.monthly && step?.isRecurring && step.stepType === StepType.payment) {
      this.openProjectModal();
      return;
    }

    let stepToEdit = step;
    if (step?.originalRetainerStepId) {
      const originalStep = this.project().steps.find(s => s.id === step.originalRetainerStepId);
      if (originalStep) stepToEdit = originalStep;
    }

    const dialogRef = this.dialog.open(NewStepModalComponent, {
      data: { step: stepToEdit, isActive: true, paymentModel: this.project().paymentModel },
    });
    dialogRef.componentInstance.stepUpdated.subscribe(newStep => this.updateStep(newStep));
  }

  // --- Tax Document ---

  showGenerateTaxDocument(stepId: string) {
    this.taxDocumentState.set({ stepId, phase: 'form', finishAfter: false });
  }

  confirmTaxDocument(step: Step) {
    this.taxDocumentState.set({ stepId: step.id ?? '', phase: 'form', finishAfter: true });
  }

  declineTaxDocument(step: Step) {
    this.taxDocumentState.set(null);
    setTimeout(() => this.changeStepStatus(step), 50);
  }

  taxDocumentCreated(step: Step) {
    this.animationsService.isLoading.set(true);
    this.httpService.getStepById(step.id!).subscribe((res: Step) => {
      this.animationsService.isLoading.set(false);
      if (this.project().steps) {
        this.project().steps = this.project().steps.map(s => s.id === res.id ? res : s);
        if (this.isRetainer) {
          this.initRetainerSteps();
        }
      }
      setTimeout(() => {
        const finishAfter = this.taxDocumentState()?.finishAfter ?? false;
        this.taxDocumentState.set(null);
        if (finishAfter) {
          setTimeout(() => this.changeStepStatus(res), 50);
        }
      }, 1);
    });
  }

  isTaxDocumentForm(stepId: string | undefined): boolean {
    const state = this.taxDocumentState();
    return state?.phase === 'form' && state.stepId === stepId;
  }

  isTaxDocumentPrompt(step: Step | undefined): boolean {
    const state = this.taxDocumentState();
    return state?.phase === 'prompt' && state.stepId === step?.id;
  }

  isInTaxDocumentFlow(stepId: string | undefined): boolean {
    return !!stepId && this.taxDocumentState()?.stepId === stepId;
  }

  // --- Drag & Drop ---

  dropStep(event: CdkDragDrop<string[]>, retainerSteps?: Step[]): void {
    if (!this.project()?.steps) return;

    if (this.isRetainer && retainerSteps) {
      moveItemInArray(retainerSteps, event.previousIndex, event.currentIndex);
    } else {
      moveItemInArray(this.project().steps, event.previousIndex, event.currentIndex);
    }

    this.updateStepsPosition();
    this.animationHackFlag = false;
    setTimeout(() => {
      this.animationHackFlag = true;
      this.activeStepId = this.stepManagementService.findActiveStep(this.project()?.steps ?? [])?.id;
    });

    this.animationsService.changeIsLoadingWithDelay();
    this.httpService.updateSteps(this.project().steps).subscribe(res => {
      this.animationsService.changeIsloading(false);
    });
  }

  dropTask(event: CdkDragDrop<any[]>, step: Step): void {
    if (!step.tasks) return;

    moveItemInArray(step.tasks, event.previousIndex, event.currentIndex);
    step.tasks.forEach((task, index) => { task.positionInStep = index; });

    const tmp = step.tasks;
    step.tasks = [];
    setTimeout(() => {
      step.tasks = tmp;
      this.updateStep(step);
    }, 0);
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

  adjustCdkPreviewHeight(div: any) {
    const cdkPreview = document.getElementsByClassName('cdk-drag retainer-step-future not-finished cdk-drag-preview')[0] as any;
    cdkPreview.style.height = (div.scrollHeight + 18) + 'px';
  }

  // --- Retainer ---

  initRetainerSteps() {
    const retainerSteps = initRetainerSteps(this.project().steps ?? []);
    this.retainerActiveSteps = retainerSteps.retainerActiveSteps;
    this.retainerFutureSteps = retainerSteps.retainerFutureSteps;
    this.retainerFinishedSteps = retainerSteps.retainerFinishedSteps;
  }

  getRetainerStepsAndUpdate() {
    const startDate = new Date();
    startDate.setHours(12, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (6 - startDate.getDay()));
    this.httpService.getRetainerSteps(startDate, endDate).subscribe(retainerSteps => {
      this.projectsService.addStepsToActiveProjects(retainerSteps);
      this.animationsService.changeIsloading(false);
    });
  }

  getWeekDays(days?: number[]) {
    return days ? days.map(d => this.daysInWeek[d]).join(', ') : [];
  }

  // --- Hover & Scroll ---

  hoverStep(stepId: string | undefined, index: number) {
    this.hoverStepId = stepId;
    const finishedSteps = this.project()?.steps.filter(s => s.isComplete).length;
    if (finishedSteps !== undefined) {
      this.setDescriptionHeight(index - finishedSteps);
    }
  }

  setDescriptionHeight(index: number) {
    const element = this.descriptions.get(index);
    if (!element) return;
    const currentHeight = Number.parseInt(element.nativeElement.style.height);
    const scrollHeight = element.nativeElement.scrollHeight;
    if (Number.isNaN(currentHeight) || currentHeight !== scrollHeight) {
      element.nativeElement.style.height = scrollHeight + 'px';
    }
  }

  scrollToBottom() {
    const container = this.stepsContainer?.nativeElement;
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 1);
  }

  clickOnAccordion(accordionNumber: number) {
    this.openedAccordion = this.openedAccordion === accordionNumber ? 0 : accordionNumber;
  }

  // --- Animation ---

  finishStepAnimationCreated(animation: AnimationItem) {
    this.finishStepAnimationItem = animation;
  }

  playLottieAnimation(): Promise<void> {
    return new Promise(resolve => {
      if (!this.finishStepAnimationItem || !this.animatingItemId) {
        resolve();
        return;
      }
      const onComplete = () => {
        this.finishStepAnimationItem?.removeEventListener('complete', onComplete);
        resolve();
      };
      try {
        this.finishStepAnimationItem.addEventListener('complete', onComplete);
        this.finishStepAnimationItem.play();
      } catch {
        resolve();
      }
    });
  }
}
