import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-free-trial-start',
  imports: [],
  templateUrl: './free-trial-start.component.html',
  styleUrl: './free-trial-start.component.scss'
})
export class FreeTrialStartComponent {
  dialogRef = inject(MatDialogRef<FreeTrialStartComponent>);


  close() {
    this.dialogRef.close();
  }
}
