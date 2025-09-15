import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Project } from '../../models/project';
import { CommonModule, DatePipe } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { parseDate } from '../../helpers/functions';
import { AuthenticationService } from '../../services/authentication.service';
import { paymentModelEnum, projectTypeEnum } from '../../models/enums';

@Component({
  selector: 'app-new-project',
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective, FormsModule],
  providers: [provideNgxMask(), DatePipe],
  templateUrl: './new-project.component.html',
  styleUrl: './new-project.component.scss'
})
export class NewProjectComponent {
  dialogRef = inject(MatDialogRef<NewProjectComponent>);
  formBuilder = inject(FormBuilder);
  authenticationService = inject(AuthenticationService);
  projectTypeEnum = projectTypeEnum;
  paymentModelEnum = paymentModelEnum;
  daysInMonth = new Array(30).fill(0).map((_, i) => i + 1);
  firstForm: FormGroup;
  project: Project;
  startDate: string = '';
  endDate: string = '';
  submitted = false;
  currentProgress = 1;

  constructor() {
    this.project = new Project();
    this.project.ownerPicture = this.authenticationService.getUserPicture() ?? undefined;
    // const today = new Date();
    // const dd = String(today.getDate()).padStart(2, '0');
    // const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    // const yy = String(today.getFullYear()).slice(-2); // Get last two digits
    // const formattedDate = `${dd}/${mm}/${yy}`;
    this.firstForm = this.formBuilder.group({
      projectName: ['', [Validators.required]],
      description: ''
    });
  }

  chooseProjectType(type: projectTypeEnum) {
    this.project.projectType = type;
    if (type === projectTypeEnum.retainer) {
      this.currentProgress += 1;
    } else {
      this.currentProgress += 2;
    }
  }

  choosePaymentModel(paymentModel: paymentModelEnum) {
    this.project.paymentModel = paymentModel;
    this.currentProgress += 1;
  }

  submit() {
    this.submitted = true;
    switch (this.currentProgress) {
      case 1:
        if (this.firstForm.valid) {
          this.currentProgress += 1;
          this.submitted = false;
        }
        break;
      case 3:
        this.dialogRef.close(this.project);
        break;
      case 4:
        if (this.project.projectType !== projectTypeEnum.retainer) {
          const startDate = parseDate(this.startDate);
          const endDate = parseDate(this.endDate);
          if (startDate) {
            this.project.startDate = startDate;
          }
          if (endDate) {
            this.project.endDate = endDate;
          }
          if (this.project.reccuringPayment) {
            this.dialogRef.close(this.project);
          }
        } else {
          this.dialogRef.close(this.project);
        }

        break;
      default:
        break;
    }


    if (this.currentProgress === 1) {

    } else if (this.currentProgress === 2) {

    } else {
      this.submitted = true;
      if (this.firstForm.valid && this.project) {
        this.project.name = this.firstForm.get("projectName")?.value;
        this.project.description = this.firstForm.get("description")?.value;
        const rawStartDate = this.firstForm.get('startDate')!.value;
        const startDate = parseDate(rawStartDate);
        if (startDate) {
          this.project.startDate = startDate;
        }
        const rawEndDate = this.firstForm.get('endDate')!.value;
        const endDate = parseDate(rawEndDate);
        if (endDate) {
          this.project.endDate = endDate;
        }

        this.dialogRef.close(this.project);
      }
    }
  }
}
