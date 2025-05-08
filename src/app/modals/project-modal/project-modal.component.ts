import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Project } from '../../models/project';
import { FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { LoadingService } from '../../services/loading.service';
import { CommonModule, DatePipe } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { parseDate } from '../../helpers/functions';

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
  loadingService = inject(LoadingService);
  formBuilder = inject(FormBuilder);
  datePipe = inject(DatePipe);
  form!: FormGroup;
  submitted = false;

  project: Project;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { project: Project }) {
    this.project = {...data.project};
    this.initForm();
  }

  initForm() {
    this.form = this.formBuilder.group({
      projectName: [this.project.name, Validators.required],
      subTitle: [this.project.subTitle, Validators.required],
      description: this.project.description,
      clientName: this.project.clientName,
      clientMail: this.project.clientMail,
      startDate: this.datePipe.transform(this.project.startDate, 'dd/MM/yy'),
      endDate: this.datePipe.transform(this.project.endDate, 'dd/MM/yy'),
      updateClient: this.project.updateClient
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      this.loadingService.changeIsloading(true);
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
    this.project.subTitle = this.form.get('subTitle')?.value;
    this.project.description = this.form.get('description')?.value;
    this.project.clientName = this.form.get('clientName')?.value;
    this.project.clientMail = this.form.get('clientMail')?.value;
    this.project.startDate = this.form.get('startDate')?.value;
    this.project.endDate = this.form.get('endDate')?.value;

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
    this.loadingService.changeIsloading(false);
    this.dialogRef.close(this.project);
  }
}
