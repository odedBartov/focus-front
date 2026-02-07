import { Component, computed, effect, inject, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Project } from '../../models/project';
import { CommonModule, DatePipe } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { parseDate } from '../../helpers/functions';
import { AuthenticationService } from '../../services/authentication.service';
import { paymentModelEnum, projectTypeEnum } from '../../models/enums';
import { ProjectsService } from '../../services/projects.service';

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
  datePipe = inject(DatePipe);
  projectsService = inject(ProjectsService);
  newProjectStepSignal: WritableSignal<number>;
  projectTypeEnum = projectTypeEnum;
  paymentModelEnum = paymentModelEnum;
  daysInMonth = new Array(30).fill(0).map((_, i) => i + 1);
  firstForm: FormGroup;
  project: Project;
  startDate: string = '';
  endDate: string = '';
  submitted = false;

  constructor() {
    effect(() => {
      if (this.newProjectStepSignal() === 0) {
        this.dialogRef.close();
      }
    });
    this.project = new Project();
    this.project.ownerPicture = this.authenticationService.getUserPicture() ?? undefined;
    this.newProjectStepSignal = this.projectsService.newProjectStepSignal;
    this.newProjectStepSignal.set(1);
    this.startDate = this.datePipe.transform(this.project.startDate, 'dd/MM/yy') ?? '';
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
      this.newProjectStepSignal.set(this.newProjectStepSignal() + 1);
    } else {
      this.newProjectStepSignal.set(this.newProjectStepSignal() + 2);
    }
  }

  choosePaymentModel(paymentModel: paymentModelEnum) {
    this.project.paymentModel = paymentModel;
    this.newProjectStepSignal.set(this.newProjectStepSignal() + 1);
  }

  submit() {
    this.submitted = true;
    switch (this.newProjectStepSignal()) {
      case 1:
        if (this.firstForm.valid) {
          this.project.name = this.firstForm.get("projectName")?.value;
          this.project.description = this.firstForm.get("description")?.value;
          this.newProjectStepSignal.set(this.newProjectStepSignal() + 1);
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
          this.dialogRef.close(this.project);
        } else {
          if (this.project.reccuringPayment !== undefined && (this.project.paymentModel === paymentModelEnum.hourly || (this.project.paymentModel === paymentModelEnum.monthly && this.project.monthlyPaymentDay !== undefined))) {
            this.dialogRef.close(this.project);
          }
        }
    }
  }
}
