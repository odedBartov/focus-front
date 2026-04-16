import { AfterViewInit, Component, inject, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Project } from '../../models/project';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { CommonModule, DatePipe } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { parseDate } from '../../helpers/functions';
import { paymentModelEnum, projectTypeEnum } from '../../models/enums';
import { debounceTime, distinctUntilChanged, filter, Subject, switchMap, takeUntil } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-project-modal',
  imports: [NgxMaskDirective, FormsModule, ReactiveFormsModule, CommonModule, MatAutocompleteModule, MatInput],
  providers: [provideNgxMask(), DatePipe],
  templateUrl: './project-modal.component.html',
  styleUrl: './project-modal.component.scss'
})
export class ProjectModalComponent implements OnDestroy, AfterViewInit {
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
  private readonly input$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  clientOptions: string[] = [];
  project: Project;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { project: Project }) {
    this.project = { ...data.project };
    this.startDate = this.datePipe.transform(this.project.startDate, 'dd/MM/yy', 'UTC') ?? '';
    this.endDate = this.datePipe.transform(this.project.endDate, 'dd/MM/yy', 'UTC') ?? '';
  }

  ngAfterViewInit(): void {
    this.initClientsAutoComplete();
  }

  initClientsAutoComplete() {
    this.input$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(v => v.trim().length >= 3),
        switchMap(v => this.httpService.getUserClients(v.trim()).pipe(

        )),
        takeUntil(this.destroy$)
      )
      .subscribe(opts => (this.clientOptions = opts));
  }

  get isRetainer() {
    return this.project.projectType === projectTypeEnum.retainer;
  }

  onInput(value: string): void {
    this.input$.next(value);
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
    const startDate = parseDate(this.startDate, 'UTC');
    if (startDate) {
      this.project.startDate = startDate;
    }
    const endDate = parseDate(this.endDate, 'UTC');
    if (endDate) {
      this.project.endDate = endDate;
    }
  }

  closeModal() {
    this.animationsService.changeIsloading(false);
    this.dialogRef.close(this.project);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
