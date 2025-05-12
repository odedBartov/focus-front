import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-new-project',
  imports: [],
  templateUrl: './new-project.component.html',
  styleUrl: './new-project.component.scss'
})
export class NewProjectComponent {
  dialogRef = inject(MatDialogRef<NewProjectComponent>);

  getCurrentProgress() {
    return 3;
  }

  closeModal(confirm: boolean){
    this.dialogRef.close(confirm);
  }
}
