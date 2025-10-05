import { Component, EventEmitter, inject, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Step } from '../../models/step';
import { NewStepComponent } from '../../components/new-step/new-step.component';
import { paymentModelEnum, projectTypeEnum } from '../../models/enums';

@Component({
  selector: 'app-new-step-modal',
  imports: [NewStepComponent],
  templateUrl: './new-step-modal.component.html',
  styleUrl: './new-step-modal.component.scss'
})
export class NewStepModalComponent {
  dialogRef = inject(MatDialogRef<NewStepModalComponent>);
  @Output() stepUpdated = new EventEmitter<Step>();
  step?: Step;
  isActive = false;
  projectType = projectTypeEnum.retainer;
  paymentModel?: paymentModelEnum;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { step: Step, isActive: boolean, paymentModel: paymentModelEnum }) {
    this.step = data.step;
    this.isActive = data.isActive;
  }

  emitNewStep(step: Step) {    
    this.stepUpdated.emit(step);
    this.dialogRef.close();
  }
}
