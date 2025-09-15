import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Project } from '../../models/project';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { CommonModule, DatePipe } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { parseDate } from '../../helpers/functions';
import { paymentModelEnum, projectTypeEnum } from '../../models/enums';

@Component({
  selector: 'app-project-modal',
  imports: [NgxMaskDirective, FormsModule, ReactiveFormsModule, CommonModule],
  providers: [provideNgxMask(), DatePipe],
  templateUrl: './project-modal.component.html',
  styleUrl: './project-modal.component.scss'
})
export class ProjectModalComponent {
  httpService = inject(HttpService);
  dialogRef = inject(MatDialogRef<ProjectModalComponent>);
  animationsService = inject(AnimationsService);
  formBuilder = inject(FormBuilder);
  datePipe = inject(DatePipe);
  paymentModelEnum = paymentModelEnum;
  form!: FormGroup;
  submitted = false;
  daysInMonth = new Array(30).fill(0).map((_, i) => i + 1);

  project: Project;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { project: Project }) {
    this.project = {...data.project};
    this.initForm();
  }

  initForm() {
    this.form = this.formBuilder.group({
      projectName: [this.project.name, Validators.required],
      description: this.project.description,
      startDate: this.datePipe.transform(this.project.startDate, 'dd/MM/yy'),
      endDate: this.datePipe.transform(this.project.endDate, 'dd/MM/yy'),
      reccuringPayment: this.project.reccuringPayment
    });
  }

  get isRetainer() {
    return this.project.projectType === projectTypeEnum.retainer;
  }

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      this.animationsService.changeIsloading(true);
      this.updateProjectFromForm();
      this.httpService.updateProjects([this.project]).subscribe(res => {
        this.project = res[0];
        this.closeModal()
      })
    } else {
      Object.values(this.form.controls).forEach(control => control.markAsTouched());
    }
  }

  updateProjectFromForm() {
    this.project.name = this.form.get('projectName')?.value;
    this.project.description = this.form.get('description')?.value;

    const rawStartDate = this.form.get('startDate')!.value;
    const startDate = parseDate(rawStartDate);
    if (startDate) { 
      this.project.startDate = startDate;
    }
    const rawEndDate = this.form.get('endDate')!.value;
    const endDate = parseDate(rawEndDate);
    if (endDate) { 
      this.project.endDate = endDate;
    }
  }

  closeModal() {
    this.animationsService.changeIsloading(false);
    this.dialogRef.close(this.project);
  }
}
