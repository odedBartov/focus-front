import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Project } from '../../models/project';
import { CommonModule, DatePipe } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { parseDate } from '../../helpers/functions';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-new-project',
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective],
  providers: [provideNgxMask(), DatePipe],
  templateUrl: './new-project.component.html',
  styleUrl: './new-project.component.scss'
})
export class NewProjectComponent {
  dialogRef = inject(MatDialogRef<NewProjectComponent>);
  formBuilder = inject(FormBuilder);
  authenticationService = inject(AuthenticationService);
  firstForm: FormGroup;
  project: Project;
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

  submit() {
    this.submitted = true;
    if (this.currentProgress === 1) {
      if (this.firstForm.valid) {
        this.currentProgress = 2;
        this.submitted = false;
      }
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
