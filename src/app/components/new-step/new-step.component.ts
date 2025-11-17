import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { paymentModelEnum, projectTypeEnum, recurringDateTypeEnum, StepType, stepTypeLabels } from '../../models/enums';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Step } from '../../models/step';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNgxMask } from 'ngx-mask';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { StepTask } from '../../models/stepTask';
import { AutoResizeInputDirective } from '../../helpers/autoResizeInputDirectory';
import { createNextOccurenceDate, getNextRetainerOccurrenceDate } from '../../helpers/retainerFunctions';
import { areDatesEqual, updateDatesWithLocalTime } from '../../helpers/functions';

@Component({
  selector: 'app-new-step',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, AutoResizeInputDirective],
  providers: [provideNgxMask(), DatePipe],
  templateUrl: './new-step.component.html',
  styleUrl: './new-step.component.scss'
})
export class NewStepComponent implements AfterViewInit {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  datePipe = inject(DatePipe);
  @ViewChild('stepNameInput') stepNameInput!: ElementRef;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef;
  @ViewChildren('taskText') tasksTexts!: QueryList<ElementRef<HTMLTextAreaElement>>;
  @Output() scrollToBottom = new EventEmitter<void>();
  @Input() defaultType?: StepType;
  @Input() projectType: projectTypeEnum = projectTypeEnum.proccess;
  @Input() paymentModel?: paymentModelEnum;
  @Input() isActive = false;
  @Input() isInModal = false;
  @Input() set steptInput(value: Step | undefined) {
    if (value) {
      this.isEdit = true;
      // this.isShowReccuringData = value.reccuringEvery !== undefined && value.reccuringEvery > 0;
      value.dateDue = value.dateDue ? new Date(value.dateDue) : value.dateDue;
      if (value.description) {
        this.isShowDescription = true;
      } else if (value.tasks && value.tasks.length > 0) {
        this.isShowTasks = true;
      }
      this.newStep = structuredClone(value);
      if (this.newStep.tasks && this.newStep.tasks?.[this.newStep.tasks.length - 1]?.text) {
        this.newStep.tasks.push(new StepTask());
      }
    }
  }
  @Input() showBorder = true;
  @Output() stepsEmitter = new EventEmitter<Step>();
  projectTypeEnum = projectTypeEnum;
  paymentModelEnum = paymentModelEnum;
  recurringDateTypeEnum = recurringDateTypeEnum;
  stepTypeLabels = stepTypeLabels;
  stepTypeEnum = StepType;
  newStep!: Step;
  submitted = false;
  isEdit = false;
  isShowDescription = false;
  isShowTasks = false;
  futureDates: (Date | undefined | null)[] = [];
  daysInWeek = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  daysInMonth = new Array(30).fill(0).map((_, i) => i + 1);


  ngAfterViewInit(): void {
    if (this.stepNameInput?.nativeElement) {
      this.stepNameInput.nativeElement.focus()
    }
    this.initFutureMonths();
    if (this.defaultType !== undefined) {
      this.selectType(this.defaultType);
    };
  }

  get isRetainer() {
    return this.projectType === projectTypeEnum.retainer;
  }

  initFutureMonths() {
    const today = new Date();
    for (let index = 0; index < 5; index++) {
      this.futureDates.push(new Date(today));
      today.setMonth(today.getMonth() + 1)
    }

    this.futureDates.push(null);
  }

  selectType(type: StepType) {
    document.body.classList.remove('hide-modal-background');
    this.newStep = new Step();
    this.newStep.stepType = type;
    this.scrollToBottom.emit();
    setTimeout(() => {
      this.stepNameInput.nativeElement.focus()
    }, 0);
  }

  showDescription() {
    this.isShowDescription = true;
    this.scrollToBottom.emit();
    setTimeout(() => {
      this.descriptionInput.nativeElement.focus();
    }, 1);
  }

  showTasks() {
    this.isShowTasks = true;
    this.newStep.tasks = this.newStep.tasks || [new StepTask()];
    this.scrollToBottom.emit();
    setTimeout(() => {
      this.tasksTexts.first.nativeElement.focus();
    }, 1);
  }

  initStepIsRecurring() {
    this.newStep.isRecurring = true;
    this.newStep.recurringEvery = 1;
  }

  isdayInWeekDay(day: string) {
    const index = this.daysInWeek.indexOf(day);
    return this.newStep.recurringDaysInWeek?.includes(index);
  }

  selectRecurringDateType(dateType: recurringDateTypeEnum) {
    this.newStep.recurringDateType = dateType;
  }

  taskTextUpdates(task: StepTask) {
    if (task.text) {
      const tasksLength = this.newStep.tasks?.length;
      if (this.newStep.tasks && tasksLength) {
        const lastTask = this.newStep.tasks[tasksLength - 1];
        if (lastTask.text) {
          this.newStep.tasks.push(new StepTask());
        }
      }
    } else {
      const taskIndex = this.newStep.tasks?.findIndex(t => t.id === task.id);
      if (taskIndex !== undefined && taskIndex >= 0) {
        this.newStep.tasks?.splice(taskIndex, 1);
      }
    }
  }

  onInputRecurringEvery(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value.length > 3) {
      input.value = input.value.slice(0, 3);
      this.newStep.recurringEvery = Number(input.value);
    }
  }

  closeRecurringEvery() {
    this.newStep.recurringEvery = 1;
    this.newStep.isRecurring = false;
    this.newStep.recurringDateType = undefined;
    this.newStep.recurringDaysInWeek = [];
    this.newStep.recurringDayInMonth = 0;
  }

  selectDayInWeek(day: string) {
    if (this.newStep.recurringDaysInWeek === undefined) {
      this.newStep.recurringDaysInWeek = [];
    }

    const weekDayIndex = this.daysInWeek.indexOf(day);
    const index = this.newStep.recurringDaysInWeek.indexOf(weekDayIndex);
    if (index > -1) {
      this.newStep.recurringDaysInWeek.splice(index, 1);
    } else {
      this.newStep.recurringDaysInWeek.push(weekDayIndex);
    }

    this.newStep.recurringDaysInWeek.sort((a, b) => a - b);
  }

  handleEnter(event: KeyboardEvent, index: number) {
    if (event.key === 'Enter') {
      event.preventDefault(); // stop line break

      const nextIndex = index + 1;
      const nextTask = this.tasksTexts.get(nextIndex);
      if (nextTask?.nativeElement) {
        nextTask.nativeElement.focus();
      }
    }
  }

  selectDate(date?: Date | null) {
    this.newStep.dateDue = date;
  }

  createStep() {
    if (this.validateStep()) {
      if (this.newStep.tasks && !this.newStep.tasks?.[this.newStep.tasks.length - 1]?.text) {
        this.newStep.tasks.pop(); // remove empty task
      }

      if (this.newStep.isRecurring) {
        if (!this.newStep.recurringEvery) {
          this.newStep.recurringEvery = 1;
        }
        this.newStep.nextOccurrence = createNextOccurenceDate(this.newStep);
        updateDatesWithLocalTime(this.newStep);
        this.setIsCompleteForRecurringStep();
        this.newStep.dateOnWeekly = this.newStep.nextOccurrence;
        this.newStep.positionInWeeklyList = 9999;
      }

      this.stepsEmitter.emit(this.newStep);
    }
  }

  setIsCompleteForRecurringStep() {
    if (!this.isEdit) {
      if (this.newStep.isRecurring && this.newStep.recurringDateType === recurringDateTypeEnum.day) {
        this.newStep.isComplete = false;
      } else {
        this.newStep.isComplete = !areDatesEqual(new Date(), this.newStep.nextOccurrence)
      }
    }
  }

  validateStep(): boolean {
    this.submitted = true;
    if (this.newStep.stepType === StepType.task) {
      return this.newStep.name !== undefined;
    } else {
      return this.newStep.name !== undefined && this.newStep.price !== undefined && this.newStep.price > 0;
    }
  }
}
