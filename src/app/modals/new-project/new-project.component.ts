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
  descriptionFormSubmitted = false;
  project: Project;

  constructor() {
    this.project = new Project();
    this.descriptionForm = this.formBuilder.group({
      title: ['', [Validators.required]],
      subTitle: ['', [Validators.required]],
      description: ''
    });
  }

  getCurrentProgress() {
    return 3;
  }

  submitDescription() {
    this.descriptionFormSubmitted = true;
    if (this.descriptionForm.valid && this.project) {
      this.project.name = this.descriptionForm.get("title")?.value;
      this.project.subTitle = this.descriptionForm.get("subTitle")?.value;
      this.project.description = this.descriptionForm.get("description")?.value;
    }
  }

  closeModal(confirm: boolean){
    this.dialogRef.close(confirm);
  }
}
