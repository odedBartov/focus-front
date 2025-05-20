import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { User, userProfessionsWithText, UserStatus, userStatusesWithText } from '../../models/user';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-user',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './new-user.component.html',
  styleUrl: './new-user.component.scss'
})
export class NewUserComponent {
  dialogRef = inject(MatDialogRef<NewUserComponent>);
  formBuilder = inject(FormBuilder);
  userForm: FormGroup;
  formSubmitted = false;
  currentProgress = 1;
  user: User;
  statuses: { status: UserStatus, text: string, icon: string }[] = userStatusesWithText;
  professions = userProfessionsWithText;

  constructor() {
    this.user = new User();
    this.userForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]]
    });
  }

  getCurrentProgress() {
    return (this.currentProgress / 4) * 100;
  }

  confirm() {
    switch (this.currentProgress) {
      case 1:
        this.formSubmitted = true;
        if (this.userForm.valid) {
          this.user.firstName = this.userForm.get("firstName")?.value;
          this.user.lastName = this.userForm.get("lastName")?.value;
          this.currentProgress++;
        }
        break;
      case 2:
        if (this.user.status) {
          this.currentProgress++
        };
        break
      case 3:
        if (this.user.profession) {
          this.dialogRef.close(this.user);
        }
        break;
    }
  }
}
