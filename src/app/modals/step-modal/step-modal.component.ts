import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Step } from '../../models/step';
import { StepType, stepTypeLabels } from '../../models/enums';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpService } from '../../services/http.service';
import { Project } from '../../models/project';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-step-modal',
  imports: [FormsModule, CommonModule],
  templateUrl: './step-modal.component.html',
  styleUrl: './step-modal.component.scss'
})

export class StepModalComponent {
  httpService = inject(HttpService);
  dialogRef = inject(MatDialogRef<StepModalComponent>);
  loadingService = inject(LoadingService);
  stepTypeEnum = StepType;
  stepTypes = Object.values(StepType).filter(value => typeof value === 'number');
  stepTypeLabels = stepTypeLabels;
  currentStep: Step;
  isNewStep = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { step: Step, project: Project }) {
    this.currentStep = data?.step ? { ...data.step } : new Step();
    this.isNewStep = data?.step? true : false;
  }

  save(stepForm: NgForm) {
    if (stepForm.valid) {
      if (this.data.step) {
        this.loadingService.changeIsloading(true);
        this.httpService.updateStep(this.currentStep).subscribe(res => {
          this.closeModal()
        })
      } else {
        this.loadingService.changeIsloading(true);
        this.currentStep.projectId = this.data.project.id;
        this.httpService.createStep(this.currentStep).subscribe(res => {
          this.closeModal()
        })
      }
    } else {
      Object.values(stepForm.controls).forEach(control => control.markAsTouched());
    }
  }

  closeModal() {
    this.loadingService.changeIsloading(false);
    this.dialogRef.close(true);
  }
}
