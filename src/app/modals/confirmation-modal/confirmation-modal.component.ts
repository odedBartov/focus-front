import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-modal',
  imports: [],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.scss'
})
export class ConfirmationModalComponent {
  dialogRef = inject(MatDialogRef<ConfirmationModalComponent>);
  stepName: string;
  constructor(@Inject(MAT_DIALOG_DATA) public data: string) {
    this.stepName = data;
  }

  closeModal(confirm: boolean){
    this.dialogRef.close(confirm);
  }
}
