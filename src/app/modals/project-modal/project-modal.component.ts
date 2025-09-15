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
  submitted = false;
  daysInMonth = new Array(30).fill(0).map((_, i) => i + 1);
  startDate = '';
  endDate = '';

  project: Project;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { project: Project }) {
    this.project = { ...data.project };
    this.startDate = this.datePipe.transform(this.project.startDate, 'dd/MM/yy') ?? '';
    this.endDate = this.datePipe.transform(this.project.endDate, 'dd/MM/yy') ?? '';    
  }


  get isRetainer() {
    return this.project.projectType === projectTypeEnum.retainer;
  }

  submit() {
    this.submitted = true;
    this.animationsService.changeIsloading(true);
    this.transfromDates();
    this.httpService.updateProjects([this.project]).subscribe(res => {
      this.project = res[0];
      this.closeModal()
    })
  }

  transfromDates() {
    const startDate = parseDate(this.startDate);
    if (startDate) {
      this.project.startDate = startDate;
    }
    const endDate = parseDate(this.endDate);
    if (endDate) {
      this.project.endDate = endDate;
    }
  }

  closeModal() {
    this.animationsService.changeIsloading(false);
    this.dialogRef.close(this.project);
  }
}
