import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Step } from '../../models/step';
import { StepType } from '../../models/stepType';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpService } from '../../services/http.service';
import { Project } from '../../models/project';

@Component({
  selector: 'app-step-modal',
  imports: [FormsModule, CommonModule],
  templateUrl: './step-modal.component.html',
  styleUrl: './step-modal.component.scss'
})

export class StepModalComponent {
  httpServcie = inject(HttpService);
  dialogRef = inject(MatDialogRef<StepModalComponent>);
  stepTypeEnum = StepType;
  stepTypes = Object.values(StepType);
  currentStep: Step;
  isNewStep = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { step: Step, project: Project }) {
    this.currentStep = data?.step ? { ...data.step } : new Step();
    this.isNewStep = data?.step? true : false;
  }

  save(stepForm: NgForm) {
    if (stepForm.valid) {
      if (this.data.step) {
        this.httpServcie.updateStep(this.data.project, this.currentStep).subscribe(res => {
          this.closeModal()
        })
      } else {
        this.httpServcie.createStep(this.data?.project, this.currentStep).subscribe(res => {
          this.closeModal()
        })
      }
    } else {
      Object.values(stepForm.controls).forEach(control => control.markAsTouched());
    }
  }

  closeModal() {
    this.dialogRef.close(true);
  }
}
