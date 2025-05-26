import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Project } from '../../models/project';
import { CommonModule, DatePipe } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { parseDate } from '../../helpers/functions';

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
  descriptionForm: FormGroup;
  descriptionSubmitted = false;
  dateForm: FormGroup;
  dateSubmitted = false;
  clientSubmitted = false;
  clientForm: FormGroup;
  project: Project;
  currentProgress = 1;

  constructor() {
    this.project = new Project();
    this.descriptionForm = this.formBuilder.group({
      title: ['', [Validators.required]],
      description: ''
    });

    this.dateForm = this.formBuilder.group({
      startDate: '',
      endDate: ''
    });

    this.clientForm = this.formBuilder.group({
      clientName: '',
      clientMail: ''
    })
  }

  getCurrentProgress() {
    return (this.currentProgress / 4) * 100;
  }

  submit() {
    switch (this.currentProgress) {
      case 1:
        this.submitDescription()
        break;
      case 2:
        this.submitDate()
        break;
      case 3:
        this.finish();
        break;
    }
  }

  submitDescription() {
    this.descriptionSubmitted = true;
    if (this.descriptionForm.valid && this.project) {
      this.project.name = this.descriptionForm.get("title")?.value;
      this.project.description = this.descriptionForm.get("description")?.value;
      this.currentProgress++;
    }
  }

  submitDate() {
    this.dateSubmitted = true;
    if (this.dateForm.valid) {
      const rawStartDate = this.dateForm.get('startDate')!.value;
      const startDate = parseDate(rawStartDate);
      if (startDate) {
        this.project.startDate = startDate;
      }
      const rawEndDate = this.dateForm.get('endDate')!.value;
      const endDate = parseDate(rawEndDate);
      if (endDate) {
        this.project.endDate = endDate;
      }
      this.currentProgress++;
    }
  }

  finish() {
    this.project.clientName = this.clientForm.get('clientName')?.value;
    this.project.clientMail = this.clientForm.get('clientMail')?.value;
    this.dialogRef.close(this.project);
  }
}
