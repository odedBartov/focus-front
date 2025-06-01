import { Component, ElementRef, EventEmitter, HostListener, inject, Input, OnInit, Output, viewChild, ViewChild } from '@angular/core';
import { StepType, stepTypeLabels } from '../../models/enums';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Step } from '../../models/step';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNgxMask } from 'ngx-mask';
import { HttpService } from '../../services/http.service';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-new-step',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule],
  providers: [provideNgxMask(), DatePipe],
  templateUrl: './new-step.component.html',
  styleUrl: './new-step.component.scss'
})
export class NewStepComponent implements OnInit {
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  datePipe = inject(DatePipe);
  @ViewChild('stepNameInput') stepNameInput!: ElementRef;
  @ViewChild('taskOption') taskOption!: ElementRef;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef;
  @Input() set steptInput(value: Step | undefined) {
    if (value) {
      this.isEdit = true;
      value.dateDue = new Date(value.dateDue);
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
  futureDates: Date[] = [];

  @HostListener('document:keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    const active = document.activeElement as HTMLElement;
    if (active) {
      active.click();
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      if (this.stepNameInput?.nativeElement) {
        this.stepNameInput.nativeElement.focus()
      }
      if (this.taskOption?.nativeElement) { 
        this.taskOption.nativeElement.focus();
      }
    }, 1);

    this.initFutureMonths();
  }

  initFutureMonths() {
    const today = new Date();
    for (let index = 0; index < 4; index++) {
      today.setMonth(today.getMonth() + 1)
      this.futureDates.push(new Date(today));
    }
  }

  selectType(type: StepType) {
    this.newStep = new Step();
    this.newStep.dateDue = this.futureDates[0];
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

  selectDate(date: Date) {
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
