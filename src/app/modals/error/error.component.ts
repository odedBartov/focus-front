import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-error',
  imports: [],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss'
})
export class ErrorComponent {
  dialogRef = inject(MatDialogRef<ErrorComponent>);

  closeModal() {
    this.dialogRef.close();
  }
}
