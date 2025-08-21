import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-free-trial-end',
  imports: [],
  templateUrl: './free-trial-end.component.html',
  styleUrl: './free-trial-end.component.scss'
})
export class FreeTrialEndComponent {
  dialogRef = inject(MatDialogRef<FreeTrialEndComponent>);

  closeModal() {
    this.dialogRef.close();
  }
}
