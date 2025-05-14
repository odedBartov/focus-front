import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Project } from '../../models/project';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-project',
  imports: [CommonModule, ReactiveFormsModule],
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
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]]
    });
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

  }

  closeModal(confirm: boolean) {
    this.dialogRef.close(confirm);
  }
}
