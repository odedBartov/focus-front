import { Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild } from '@angular/core';
import { StepType, stepTypeLabels } from '../models/enums';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Step } from '../models/step';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNgxMask } from 'ngx-mask';
import { HttpService } from '../services/http.service';
import { LoadingService } from '../services/loading.service';
import { parseDate } from '../helpers/functions';

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
  @Input() set steptInput(value: Step | undefined) {
    if (value) {
      this.isEdit = true;
      this.selectedType = value.stepType
      this.newStep = value;
      // this.form.patchValue({ name: value.name });
      // this.form.patchValue({ description: value.description });
      // const formattedDate = this.datePipe.transform(value.dateDue, 'dd/MM/yy');
      // this.form.patchValue({ dateDue: formattedDate });
      // this.form.patchValue({ price: value.price });
      // this.step.set({ ...value });
    }
  }
  // step = signal<Step | undefined>(undefined);
  @Output() stepsEmitter = new EventEmitter<Step>();
  stepTypes: { text: string, icon: string, type: StepType }[] = []
  stepTypeLabels = stepTypeLabels;
  stepTypeEnum = StepType;
  selectedType!: StepType;
  newStep!: Step;
  submitted = false;
  isEdit = false;
  showDescription = false;
  inOneMonth = new Date();
  inTwoMonths = new Date();
  inThreeMonths = new Date();
  inFourMonths = new Date();

  ngOnInit(): void {
    this.stepTypes = [
      { text: "שלב בפרויקט שצריך לבצע", icon: "working", type: StepType.task },
      { text: "על ידי הלקוח", icon: "dollar", type: StepType.payment }
    ];

    setTimeout(() => {
      if (this.stepNameInput?.nativeElement) {
        this.stepNameInput.nativeElement.focus()
      }
    }, 0);

    this.initFutureMonths();
  }

  initFutureMonths() {
    this.inOneMonth.setMonth(this.inOneMonth.getMonth() + 1)
    this.inTwoMonths.setMonth(this.inTwoMonths.getMonth() + 2)
    this.inTwoMonths.setMonth(this.inTwoMonths.getMonth() + 3)
    this.inFourMonths.setMonth(this.inFourMonths.getMonth() + 4)
  }

  selectType(type: StepType) {
    this.newStep = new Step();
    this.newStep.stepType = type;
    this.selectedType = type;
    setTimeout(() => {
      this.stepNameInput.nativeElement.focus()
    }, 0);
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
