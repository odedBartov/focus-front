import { Component, ElementRef, HostListener, Inject, inject, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
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
  @ViewChildren('statusesDiv') statusesDiv!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChildren('professionsDiv') professionsDiv!: QueryList<ElementRef<HTMLDivElement>>;
  userForm: FormGroup;
  formSubmitted = false;
  currentProgress = 1;
  user: User;
  statuses = userStatusesWithText;
  professions = userProfessionsWithText;
  mobileNotificationUrl = "https://join.focus-app.co.il/mobile";

  constructor(@Inject(MAT_DIALOG_DATA) public data: { user: User }) {
    this.user = data.user;
    this.userForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]]
    });

  }

  @HostListener('document:keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    const active = document.activeElement as HTMLElement;
    if (active) {
      active.click();
    }
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
          setTimeout(() => {
            const firstStatus = this.statusesDiv.first;
            if (firstStatus) {
              firstStatus.nativeElement.focus();
            }
          }, 1);
        }
        break;
      case 2:
        if (this.user.status !== undefined) {
          this.currentProgress++
          setTimeout(() => {
            const firstProfession = this.professionsDiv.first;
            if (firstProfession) {
              firstProfession.nativeElement.focus();
            }
          }, 1);
        };
        break
      case 3:
        if (this.user.profession !== undefined) {
          this.dialogRef.close(this.user);
          const userAgent = navigator.userAgent.toLowerCase();
          const isMobile = /android|ipad|iphone|ipod|mobile|tablet/i.test(userAgent);
          if (isMobile) {
            window.location.href = this.mobileNotificationUrl + "?email=" + this.user.email;
          }
        }
        break;
    }
  }
}
