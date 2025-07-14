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
  @ViewChild('taskOption') taskOption!: ElementRef;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef;
  @ViewChildren('taskText') tasksTexts!: QueryList<ElementRef<HTMLTextAreaElement>>;
  @Input() defaultType?: StepType;
  @Input() set steptInput(value: Step | undefined) {
    if (value) {
      this.isEdit = true;
      value.dateDue = value.dateDue ? new Date(value.dateDue) : value.dateDue;
      if (value.description) {
        this.isShowDescription = true;
      } else if (value.tasks && value.tasks.length > 0) {
        this.isShowTasks = true;
      }
      this.newStep = value;
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
  futureDates: (Date | undefined)[] = [];

  @HostListener('document:keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    const active = document.activeElement as HTMLElement;
    if (active) {
      active.click();
    }
  }

  ngAfterViewInit(): void {
    if (this.stepNameInput?.nativeElement) {
      this.stepNameInput.nativeElement.focus()
    }
    if (this.taskOption?.nativeElement) {
      this.taskOption.nativeElement.focus();
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

    this.futureDates.push(undefined);
  }

  selectType(type: StepType) {
    this.newStep = new Step();
    this.newStep.stepType = type;
    setTimeout(() => {
      this.stepNameInput.nativeElement.focus()
    }, 0);
  }

  showDescription() {
    this.isShowDescription = true;
    setTimeout(() => {
      this.descriptionInput.nativeElement.focus();
    }, 1);
  }

  showTasks() {
    this.isShowTasks = true;
    this.newStep.tasks = this.newStep.tasks || [new StepTask()];
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
      this.newStep.tasks?.pop();
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
      // const textareas = document.querySelectorAll('textarea');

      // if (nextIndex < textareas.length) {
      //   (textareas[nextIndex] as HTMLTextAreaElement).focus();
      // }
    }
  }

  selectDate(date: Date | undefined) {
    this.newStep.dateDue = date;
  }

  createStep() {
    if (this.validateStep()) {
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
