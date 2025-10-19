import { AfterViewInit, ChangeDetectorRef, Component, effect, ElementRef, EventEmitter, HostListener, inject, OnInit, Output, QueryList, ViewChild, ViewChildren, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from '../../models/project';
import { HttpService } from '../../services/http.service';
import { CommonModule } from '@angular/common';
import { Step } from '../../models/step';
import { AnimationsService } from '../../services/animations.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NewStepComponent } from '../new-step/new-step.component';
import { paymentModelEnum, ProjectStatus, projectTypeEnum, recurringDateTypeEnum, retainerPaymentTypeEnum, StepType } from '../../models/enums';
import { ProjectModalComponent } from '../../modals/project-modal/project-modal.component';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NotesComponent } from '../notes/notes.component';
import { ProjectHoverService } from '../../services/project-hover.service';
import { RichTextComponent } from "../rich-text/rich-text.component";
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { ProjectsService } from '../../services/projects.service';
import { AuthenticationService } from '../../services/authentication.service';
import { AutoResizeInputDirective } from '../../helpers/autoResizeInputDirectory';
import { StepTask } from '../../models/stepTask';
import { AnimationItem } from 'lottie-web';
import { RetainerPayment } from '../../models/RetainerPayment';
import { HourlyWorkSession } from '../../models/hourlyWorkSession';
import { areTwoDaysInTheSameWeek, isDateGreaterOrEqual, parseLocalDate } from '../../helpers/functions';
import { NewStepModalComponent } from '../../modals/new-step-modal/new-step-modal.component';
import { PaymentHistoryModalComponent } from '../../modals/payment-history-modal/payment-history-modal.component';
import { WorkSessionService } from '../../services/work-session.service';

@Component({
  selector: 'app-project-page',
  imports: [CommonModule, MatDialogModule, FormsModule, MatTooltipModule, DragDropModule, NewStepComponent, NotesComponent, RichTextComponent, LottieComponent, AutoResizeInputDirective],
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
  @Output() navigateToHomeEmitter = new EventEmitter<void>();
  @ViewChild('stepsContainer', { static: false }) stepsContainer?: ElementRef;
  @ViewChild('newStepDiv', { static: false }) newStepDiv?: ElementRef;
  @ViewChild('notesDiv', { static: false }) notesDiv?: ElementRef;
  @ViewChild('richTextDiv', { static: false }) richTextDiv?: ElementRef;
  @ViewChild('addStepDiv', { static: false }) addStepDiv!: ElementRef;
  @ViewChildren('descriptions') descriptions!: QueryList<ElementRef<HTMLTextAreaElement>>;
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
  showNotes = false;
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
  private _sessionTimerStep = 1;
  get sessionTimerStep() {
    return this._sessionTimerStep;
  }
  set sessionTimerStep(value: number) {
    this._sessionTimerStep = value;
    this.WorkSessionService.changeIsSessionActive(value !== 1);
  }
  sessionTime = 0;
  sessionTimer?: any;
  retainerPaymentName = '';
  openedAccordion = 1;
  retainerActiveSteps: Step[] = [];
  retainerFutureSteps: Step[] = [];
  retainerFinishedSteps: Step[] = [];
  daysInWeek = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  buzzWorkSession = false;

  constructor(private changeDetectorRef: ChangeDetectorRef) {
    this.project = this.projectsService.getCurrentProject();
    effect(() => {
      const value = this.project();
      if (value?.steps) {
        value.steps.sort((a, b) => a.positionInList - b.positionInList);
        if (value.projectType === projectTypeEnum.retainer) {
          this.initRetainerSteps();
        }
      }
      this.activeStepId = value?.steps?.find(s => !s.isComplete)?.id;
      this.loadSessionTimer();
      this.calculatePayments();

      setTimeout(() => {
        this.setActiveStepHeight();
      }, 1);
    });
  }

  ngOnInit(): void {
    this.loadProject();
    this.isReadOnly = this.authenticationService.getIsReadOnly();
    this.listenToBuzz();
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

    if (this.notesDiv?.nativeElement &&
      !this.notesDiv.nativeElement.contains(event.target) &&
      !this.richTextDiv?.nativeElement.contains(event.target)) {
      this.showNotes = false;
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

  get hours() {
    return this.pad(Math.floor(this.sessionTime / 3600000));
  }

  get minutes() {
    return this.pad(Math.floor((this.sessionTime % 3600000) / 60000));
  }

  get seconds() {
    return this.pad(Math.floor((this.sessionTime % 60000) / 1000));
  }

  get isPaymentModelHourly() {
    return this.project().paymentModel === paymentModelEnum.hourly;
  }

  pad(num: number) {
    return num.toString().padStart(2, '0');
  }

  listenToBuzz() {
    this.WorkSessionService.getObservable().subscribe(() => {
      this.buzzWorkSession = true;
      setTimeout(() => {
        this.buzzWorkSession = false;
      }, 600);
    });
  }

  getWeekDays(days?: number[]) {
    return days ? days.map(d => this.daysInWeek[d]).join(', ') : [];
  }

  initRetainerSteps() {
    this.retainerActiveSteps = [];
    this.retainerFutureSteps = [];
    this.retainerFinishedSteps = [];
    if (this.project()?.steps) {
      this.project().steps.forEach(step => {
        if (!step.isComplete) {
          this.retainerActiveSteps.push(step);
        } else {
          if (step.isRecurring) {
            // const dateCreated = parseLocalDate(step.dateCreated ?? step.dateCompleted);
            const dateDue = parseLocalDate(step.dateDue ?? step.dateCompleted);
            const dateCompleted = parseLocalDate(step.dateCompleted);
            const today = new Date();
            let nextOccurrenceDate = new Date(dateDue);
            let occurIntervalCounter = new Date(nextOccurrenceDate);
            if (step.recurringDateType === recurringDateTypeEnum.day) {
              occurIntervalCounter.setDate(occurIntervalCounter.getDate() + (step.recurringEvery ?? 1));
              // nextOccurrenceDate.setDate(occurIntervalCounter.getDate());
              while (isDateGreaterOrEqual(today, occurIntervalCounter)) {
                nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + (step.recurringEvery ?? 1));
                occurIntervalCounter.setDate(occurIntervalCounter.getDate() + (step.recurringEvery ?? 1));
              }
              step.dateDue = new Date(nextOccurrenceDate);
            } else if (step.recurringDateType === recurringDateTypeEnum.week && step.recurringDaysInWeek?.length) {
              if (areTwoDaysInTheSameWeek(dateDue, dateCompleted)) { // maybe there is another weekly step in the same week
                // look for next day in week
                const dayInWeekCompleted = dateCompleted.getDay();
                let nextDayInWeek = -1;
                for (let index = 0; index < step.recurringDaysInWeek.length; index++) { // check if there is another task in the same week
                  if (step.recurringDaysInWeek[index] > dayInWeekCompleted) {
                    nextDayInWeek = step.recurringDaysInWeek[index];
                    break;
                  }
                }
                if (nextDayInWeek > -1) { // we are still in target week
                  nextOccurrenceDate.setDate(dateDue.getDate() + (nextDayInWeek - dateDue.getDay()));
                } else { // should look at next week
                  nextOccurrenceDate.setDate(dateDue.getDate() + (step.recurringEvery ?? 1) * 7);
                  step.dateDue?.setDate(nextOccurrenceDate.getDate());
                }
              } else { // should look at next week
                nextOccurrenceDate.setDate(dateDue.getDate() + (step.recurringEvery ?? 1) * 7);
              }
            } else { // month
              occurIntervalCounter.setMonth(occurIntervalCounter.getMonth() + (step.recurringEvery ?? 1));
              occurIntervalCounter.setDate(step.recurringDayInMonth ?? dateDue.getDate());
              nextOccurrenceDate.setDate(step.recurringDayInMonth ?? dateDue.getDate());
              while (isDateGreaterOrEqual(today, occurIntervalCounter)) {
                nextOccurrenceDate = new Date(occurIntervalCounter);
                occurIntervalCounter.setMonth(occurIntervalCounter.getMonth() + (step.recurringEvery ?? 1));
              }
              step.dateDue = new Date(nextOccurrenceDate);
            }

            if (isDateGreaterOrEqual(dateCompleted, nextOccurrenceDate) || nextOccurrenceDate > today) {
              this.retainerFutureSteps.push(step);
            } else {
              if (step.tasks?.length) {
                step.tasks.forEach(t => t.isComplete = false);
              }

              this.retainerActiveSteps.push(step);
            }
          } else {
            this.retainerFinishedSteps.push(step);
          }
        }
      });
    }

    this.updateRetainerStepsPositions();
  }

  updateRetainerStepDate(step: Step, nextOccurrenceDate: Date) {
    const today = new Date();
    let newCreatedDate = new Date(step.dateCreated ?? new Date(0));
    while (newCreatedDate <= today) {
      const deltaDays = step.recurringDateType === recurringDateTypeEnum.day ? (step.recurringEvery ?? 1) :
        step.recurringDateType === recurringDateTypeEnum.week ? (step.recurringEvery ?? 1) * 7 :
          (step.recurringEvery ?? 1) * 30;
      step.dateCreated?.setDate(newCreatedDate.getDate() + deltaDays);
      newCreatedDate.setDate(newCreatedDate.getDate() + deltaDays);
    }
  }

  getProjectPrice() : number {
    if (this.isRetainer && this.project().paymentModel === paymentModelEnum.hourly) {
      const totalHours = this.project().hourlyWorkSessions.reduce((acc, session) => acc + (session.workTime / 3600000), 0);
      return totalHours * (this.project().reccuringPayment ?? 0);
    } else return this.baseProjectPrice;
  }

  loadSessionTimer() {
    if (this.isRetainer && this.project().paymentModel === paymentModelEnum.hourly) {
      const storedSession = this.WorkSessionService.getSession(this.project().id);
      if (storedSession) {
        this.sessionTime = storedSession;
        this.sessionTimerStep = 2;
      }
    }
  }

  startSessionTimer() {
    if (this.sessionTimerStep === 1) {
      this.resumeSessionTimer();
      this.sessionTimerStep = 2;
    }
  }

  resumeSessionTimer() {
    this.WorkSessionService.changeIsSessionActive(true);
    if (!this.sessionTimer) {
      this.sessionTimer = setInterval(() => {
        this.sessionTime += 1000;
      }, 1000);
    }
  }

  stopSessionTimer() {
    this.pauseSessionTimer();
    this.sessionTimerStep = 3;
    this.retainerPaymentName = this.retainerActiveSteps[0].name ?? 'שלב נוכחי';
  }

  pauseSessionTimer() {
    this.WorkSessionService.storeSession(this.project().id, this.sessionTime);
    this.WorkSessionService.changeIsSessionActive(false);
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = undefined;
    }
  }

  deleteWorkingSession(event: Event) {
    this.WorkSessionService.deleteSession(this.project().id);
    event?.stopPropagation();
    event?.preventDefault();
    this.sessionTime = 0;
    this.sessionTimerStep = 1;
    this.pauseSessionTimer();
  }

  finishWorkingSession(event: Event) {
    this.WorkSessionService.deleteSession(this.project().id);
    if (this.retainerPaymentName) {
      event?.stopPropagation();
      event?.preventDefault();
      const payment = new HourlyWorkSession();
      payment.name = this.retainerPaymentName;
      payment.price = (this.sessionTime / 3600000) * (this.project()?.reccuringPayment ?? 0);
      payment.date = new Date();
      payment.workTime = this.sessionTime;
      payment.projectId = this.project().id ?? '';

      this.sessionTime = 0;
      this.sessionTimerStep = 1;
      this.pauseSessionTimer();
      this.calculatePayments();
      this.httpService.createHourlyWorkSession(payment).subscribe(res => {
        this.project()?.hourlyWorkSessions.push(res);
      });
    }
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
    // setTimeout(() => {
    //   this.setActiveStepHeight()
    // }, 40);
  }

  updateStepsPosition() {
    if (this.project()?.steps) {
      for (let index = 0; index < this.project()?.steps.length; index++) {
        this.project().steps[index].positionInList = index;
      }
    }

    if (this.isRetainer) {
      this.updateRetainerStepsPositions();
    }
  }

  updateRetainerStepsPositions() {
    for (let index = 0; index < this.retainerActiveSteps.length; index++) {
      this.retainerActiveSteps[index].positionInList = index;
    }
    this.retainerActiveSteps.sort(s => s.positionInList);

    for (let index = 0; index < this.retainerFutureSteps.length; index++) {
      this.retainerFutureSteps[index].positionInList = index;
    }
    this.retainerFutureSteps.sort(s => s.positionInList);

    for (let index = 0; index < this.retainerFinishedSteps.length; index++) {
      this.retainerFinishedSteps[index].positionInList = index;
    }
    this.retainerFinishedSteps.sort(s => s.positionInList);
  }

  adjustCdkPreviewHeight(div: any) { // this is stupid. angular is stupid
    const cdkPreview = document.getElementsByClassName("cdk-drag retainer-step-future not-finished cdk-drag-preview")[0] as any;
    cdkPreview.style.height = (div.scrollHeight + 18) + 'px';
  }

  dropStep(event: CdkDragDrop<string[]>, retainerSteps?: Step[]) {
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
        this.activeStepId = this.project()?.steps?.find(s => !s.isComplete)?.id;
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

  loadProject() {
    if (this.projectId) {
      this.animationsService.changeIsloading(true);
      this.httpService.getProject(this.projectId).subscribe(res => {
        if (res.steps) {
          this.project.set(res);
          if (this.project()?.steps) {
            this.project().steps = this.project().steps.sort((a, b) => a.positionInList - b.positionInList);
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
    this.project()?.steps?.forEach(step => {
      if (step.stepType === StepType.payment) {
        this.baseProjectPrice += step.price;
        if (step.isComplete) {
          this.paidMoney += step.price;
        }
      }
    });
  }

  changeStepStatus(step: Step) {
    this.animatingItemId = step.isRecurring || (!step.isRecurring && !step.isComplete) ? step.id : undefined;
    this.changeDetectorRef.detectChanges(); // Ensure the view is updated before the animation starts
    setTimeout(() => {
      this.playLottieAnimation().then(() => {
        this.animatingItemId = '';
        step.isComplete = step.isRecurring ? true : !step.isComplete;
        if (step.isComplete) {
          step.dateCompleted = new Date();
          if (this.project()) {
            let finishedSteps = 0;
            let notFinishedSteps = 0;
            for (let index = 0; index < this.project().steps.length; index++) {
              const currentStep = this.project().steps[index];
              if (currentStep.isComplete) {
                if (currentStep.id !== step.id) {
                  finishedSteps++;
                } else {
                  break;
                }
              } else {
                notFinishedSteps++;
              }
            }

            moveItemInArray(this.project().steps, finishedSteps + notFinishedSteps, finishedSteps);
            this.updateStepsPosition();
          }
        } else {
          step.dateCompleted = undefined;
          let passedStep = false;
          let stepsToMove = 0;
          let currentIndex = 0;
          if (this.project) {
            for (let index = 0; index < this.project().steps.length; index++) {
              const currentStep = this.project().steps[index];
              if (currentStep.id === step.id) {
                passedStep = true;
                currentIndex = index;
              } else {
                if (currentStep.isComplete) {
                  if (passedStep) {
                    stepsToMove++;
                  }
                } else {
                  break;
                }
              }
            }
            moveItemInArray(this.project().steps, currentIndex, currentIndex + stepsToMove);
            this.updateStepsPosition();
          }
        }

        if (this.isRetainer) {
          this.initRetainerSteps();
        }
        this.activeStepId = this.project()?.steps?.find(s => !s.isComplete)?.id;
        this.updateStep(step);
      })
    }, 1);
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
    const stepsInProgress = this.project()?.steps.filter(s => !s.isComplete).length;
    if (stepsInProgress === 0) {
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
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.project.set(res);
      }
    })
  }

  showNewStep() {
    this.isShowNewStep = true;
    this.scrollToBottom();
  }

  showNewStepModal() {
    const dialogRef = this.dialog.open(NewStepModalComponent, { autoFocus: false, data: {paymentModel: this.project().paymentModel} });
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
      this.project()?.steps?.push(res);
      this.retainerActiveSteps.push(res);
      this.isShowNewStep = false;
      this.calculatePayments();
      this.animationsService.changeIsloading(false);
    })
  }

  editStep(div: HTMLDivElement, stepId: string | undefined) {
    this.editDiv = div;
    this.editStepId = stepId;
  }

  openNewStepModal(step?: Step) {
    const dialogRef = this.dialog.open(NewStepModalComponent, { data: { step: step, isActive: true, paymentModel: this.project().paymentModel } });
    const childInstance = dialogRef.componentInstance;
    childInstance.stepUpdated.subscribe(newStep => {
      this.updateStep(newStep);
    });
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

  showNotesPopup(show: boolean) {
    this.showNotes = show;
    this.projectHoverService.projectHover('empty');
  }

  scrollToBottom() {
    const container = this.stepsContainer?.nativeElement;
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 1);
  }
}
