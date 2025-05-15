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
  dateAndPriceForm: FormGroup;
  dateAndPriceSubmitted = false;
  clientSubmitted = false;
  clientForm: FormGroup;
  project: Project;
  currentProgress = 1;

  constructor() {
    this.project = new Project();
    this.descriptionForm = this.formBuilder.group({
      title: ['', [Validators.required]],
      subTitle: ['', [Validators.required]],
      description: ''
    });

    this.dateAndPriceForm = this.formBuilder.group({
      price: ['', [Validators.required]],
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
        this.submitDateAndPrice()
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
      this.project.subTitle = this.descriptionForm.get("subTitle")?.value;
      this.project.description = this.descriptionForm.get("description")?.value;
      this.currentProgress++;
    }
  }

  submitDateAndPrice() {
    this.dateAndPriceSubmitted = true;
    if (this.dateAndPriceForm.valid) {
      this.project.basePrice = this.dateAndPriceForm.get("price")?.value;
      const rawStartDate = this.dateAndPriceForm.get('startDate')!.value;
      const startDate = parseDate(rawStartDate);
      if (startDate) {
        this.project.startDate = startDate;
      }
      const rawEndDate = this.dateAndPriceForm.get('endDate')!.value;
      const endDate = parseDate(rawEndDate);
      if (endDate) {
        this.project.endDate = endDate;
      }
      this.currentProgress++;
    }
  }

  closeModal(confirm: boolean) {
    this.dialogRef.close(confirm);
  }

  finish() {
    this.project.clientName = this.clientForm.get('clientName')?.value;
    this.project.clientMail = this.clientForm.get('clientMail')?.value;
    this.dialogRef.close(this.project);
  }
}
