import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-bonus-for-activity',
  imports: [],
  templateUrl: './bonus-for-activity.component.html',
  styleUrl: './bonus-for-activity.component.scss'
})
export class BonusForActivityComponent {
  dialogRef = inject(MatDialogRef<BonusForActivityComponent>);

  close() {
    this.dialogRef.close();
  }
}
