import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, Input, OnInit, Output, QueryList, viewChild, ViewChild, ViewChildren } from '@angular/core';
import { StepType, stepTypeLabels } from '../../models/enums';
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
  @Input() isRetainer = false;
  @Input() set steptInput(value: Step | undefined) {
    if (value) {
      this.isEdit = true;
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
  @Output() stepsEmitter = new EventEmitter<Step>();
  stepTypeLabels = stepTypeLabels;
  stepTypeEnum = StepType;
  newStep!: Step;
  submitted = false;
  isEdit = false;
  isShowDescription = false;
  isShowTasks = false;
  futureDates: (Date | undefined | null)[] = [];

  @HostListener('document:keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    const active = document.activeElement as HTMLElement;
    if (active) {
      active.click();
    }
    if (this.stepNameInput?.nativeElement === document.activeElement) {
      if (this.isShowDescription) {
        this.descriptionInput.nativeElement.focus();
      } else if (this.isShowTasks) {
        this.handleEnter(event, -1);
      } else {
        this.createStep();
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.stepNameInput?.nativeElement) {
      this.stepNameInput.nativeElement.focus()
    }
    this.initFutureMonths();
    if (this.defaultType !== undefined) {
      this.selectType(this.defaultType);
    };
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
      this.stepsEmitter.emit(this.newStep);
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
