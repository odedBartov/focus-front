import { Component, EventEmitter, Input, Output, WritableSignal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { Project } from '../../models/project';
import { paymentModelEnum, projectTypeEnum } from '../../models/enums';
import { ProjectHoverService } from '../../services/project-hover.service';
import { WorkSessionService } from '../../services/work-session.service';

@Component({
  selector: 'app-project-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTooltipModule],
  templateUrl: './project-summary.component.html',
  styleUrl: './project-summary.component.scss'
})
export class ProjectSummaryComponent {
  projectHoverService = inject(ProjectHoverService);
  WorkSessionService = inject(WorkSessionService);

  @Input({ required: true }) project!: WritableSignal<Project>;
  @Input({ required: true }) isReadOnly!: WritableSignal<boolean>;
  @Input() baseProjectPrice: number = 0;
  @Input() paidMoney: number = 0;
  @Input() retainerActiveSteps: any[] = [];
  @Output() openProjectModalEvent = new EventEmitter<void>();
  @Output() openPaymentHistoryModalEvent = new EventEmitter<void>();
  @Output() finishWorkingSessionEvent = new EventEmitter<{ name: string, workTime: number, price: number }>();

  paymentModelEnum = paymentModelEnum;
  projectTypeEnum = projectTypeEnum;
  hideProperties = this.projectHoverService.getSignal();
  
  // Session timer properties
  private _sessionTimerStep = 1;
  get sessionTimerStep() {
    return this._sessionTimerStep;
  }
  set sessionTimerStep(value: number) {
    this._sessionTimerStep = value;
    this.WorkSessionService.changeIsSessionActive(value !== 1);
  }
  
  sessionTime = 0;
  lastStartTime = 0;
  accumulatedTime = 0;
  sessionTimer?: any;
  retainerPaymentName = '';
  buzzWorkSession = false;

  get isRetainer() {
    return this.project()?.projectType === projectTypeEnum.retainer;
  }

  get isPaymentModelHourly() {
    return this.project().paymentModel === paymentModelEnum.hourly;
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

  ngOnInit(): void {
    this.listenToBuzz();
    this.loadSessionTimer();
  }

  ngOnDestroy(): void {
    if (this.sessionTimer) {
      this.pauseSessionTimer();
    }
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

  getProjectPrice(): number {
    if (this.isRetainer && this.project().paymentModel === paymentModelEnum.hourly) {
      const totalHours = this.project().hourlyWorkSessions.reduce((acc, session) => acc + (session.workTime / 3600000), 0);
      return Math.round(totalHours * (this.project().reccuringPayment ?? 0));
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

  copyProjectUrl(tooltip: MatTooltip) {
    navigator.clipboard.writeText(window.location.href);
    tooltip.disabled = false;
    tooltip.show();
    setTimeout(() => {
      tooltip.disabled = true;
      tooltip.hide();
    }, 1000);
  }

  openProjectModal() {
    this.openProjectModalEvent.emit();
  }

  openPaymentHistoryModal() {
    this.openPaymentHistoryModalEvent.emit();
  }

  startSessionTimer() {
    if (this.sessionTimerStep === 1) {
      this.resumeSessionTimer();
      this.sessionTimerStep = 2;
    }
  }

  resumeSessionTimer() {
    this.WorkSessionService.changeIsSessionActive(true);
    this.accumulatedTime = this.sessionTime;
    this.lastStartTime = Date.now();
    if (!this.sessionTimer) {
      this.sessionTimer = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - this.lastStartTime;
        this.sessionTime = this.accumulatedTime + elapsed;
      }, 1000);
    }
  }

  stopSessionTimer() {
    this.pauseSessionTimer();
    this.sessionTimerStep = 3;
    this.retainerPaymentName = this.retainerActiveSteps[0]?.name ?? 'שלב נוכחי';
  }

  pauseSessionTimer() {
    this.WorkSessionService.storeSession(this.project().id, this.sessionTime);
    this.WorkSessionService.changeIsSessionActive(false);
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = undefined;
      this.lastStartTime = 0;
      this.accumulatedTime = 0;
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
    if (this.retainerPaymentName) {
      event?.stopPropagation();
      event?.preventDefault();
      
      const price = (this.sessionTime / 3600000) * (this.project()?.reccuringPayment ?? 0);
      
      // Emit event to parent to handle HTTP call and project updates
      this.finishWorkingSessionEvent.emit({
        name: this.retainerPaymentName,
        workTime: this.sessionTime,
        price: price
      });
      
      this.WorkSessionService.deleteSession(this.project().id);
      this.sessionTime = 0;
      this.sessionTimerStep = 1;
      this.pauseSessionTimer();
    }
  }
}
