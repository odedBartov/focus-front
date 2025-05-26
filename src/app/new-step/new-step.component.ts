import { Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild } from '@angular/core';
import { StepType, stepTypeLabels } from '../models/enums';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  formBuilder = inject(FormBuilder);
  loadingService = inject(LoadingService);
  datePipe = inject(DatePipe);
  @ViewChild('stepNameInput') stepNameInput!: ElementRef;
  @Input() set steptInput(value: Step | undefined) {
    if (value) {
      this.isEdit = true;
      this.selectedType = value.stepType
      this.form.patchValue({ name: value.name });
      this.form.patchValue({ description: value.description });
      const formattedDate = this.datePipe.transform(value.dateDue, 'dd/MM/yy');
      this.form.patchValue({ dateDue: formattedDate });
      this.form.patchValue({ price: value.price });
      this.step.set({ ...value });
    }
  }
  step = signal<Step | undefined>(undefined);
  @Output() stepsEmitter = new EventEmitter<Step>();
  stepTypes: { text: string, icon: string, type: StepType }[] = []
  stepTypeLabels = stepTypeLabels;
  stepTypeEnum = StepType;
  selectedType!: StepType;
  newStep!: Step;
  form: FormGroup;
  submitted = false;
  isEdit = false;

  constructor() {
    this.form = this.formBuilder.group({
      dateDue: ['', [Validators.required]],
      description: '',
      name: ['', Validators.required],
      price: [0, Validators.required]
    });
  }

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
  }

  selectType(type: StepType) {
    this.newStep = new Step();
    this.newStep.stepType = type;
    this.selectedType = type;
    setTimeout(() => {
      this.stepNameInput.nativeElement.focus()
    }, 0);
  }

  editStepType(type: StepType) {
    const updatedStep = this.step();
    if (updatedStep) {
      updatedStep.stepType = type;
      this.step.update(current => updatedStep);
      this.selectedType = type;
    }
  }

  createStep() {
    const oldStep = this.step();
    if (oldStep) {
      this.newStep = oldStep;
    }
    this.submitted = true;
    const raw = this.form.get('dateDue')!.value;
    const parsed = parseDate(raw);
    if (!parsed) {
      this.form.get('dateDue')!.setErrors({ invalidDate: true });
      return;
    } else {
      this.newStep.dateDue = parsed;
    }

    const name = this.form.get('name')!.value;
    if (!name) {
      this.form.get('name')!.setErrors({ invalidDate: true });
      return;
    } else {
      this.newStep.name = name;
    }

    const price = this.form.get('price')!.value;
    if (this.selectedType === StepType.payment && (price === undefined || price === '' || price <= 0)) {
      this.form.get('price')!.setErrors({ invalidDate: true });
      return;
    } else {
      this.newStep.price = price;
    }
    this.newStep.description = this.form.get('description')!.value;
    this.stepsEmitter.emit(this.newStep);
  }
}
