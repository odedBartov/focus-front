import { AfterViewInit, Component, effect, inject, OnDestroy, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Project } from '../../models/project';
import { CommonModule, DatePipe } from '@angular/common';
import { provideNgxMask } from 'ngx-mask';
import { AuthenticationService } from '../../services/authentication.service';
import { paymentModelEnum, projectTypeEnum } from '../../models/enums';
import { ProjectsService } from '../../services/projects.service';
import { debounceTime, distinctUntilChanged, filter, Subject, switchMap, takeUntil } from 'rxjs';
import { HttpService } from '../../services/http.service';
import { MatInput } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-new-project',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatAutocompleteModule, MatInput],
  providers: [provideNgxMask(), DatePipe],
  templateUrl: './new-project.component.html',
  styleUrl: './new-project.component.scss'
})
export class NewProjectComponent implements OnDestroy, AfterViewInit {
  dialogRef = inject(MatDialogRef<NewProjectComponent>);
  formBuilder = inject(FormBuilder);
  authenticationService = inject(AuthenticationService);
  datePipe = inject(DatePipe);
  projectsService = inject(ProjectsService);
  httpService = inject(HttpService);
  newProjectStepSignal: WritableSignal<number>;
  projectTypeEnum = projectTypeEnum;
  paymentModelEnum = paymentModelEnum;
  daysInMonth = new Array(30).fill(0).map((_, i) => i + 1);
  firstForm: FormGroup;
  project: Project;
  submitted = false;
  private readonly input$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  clientOptions: string[] = [];

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
    this.firstForm = this.formBuilder.group({
      projectName: ['', [Validators.required]],
      description: ''
    });
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

  onInput(value: string): void {
    this.input$.next(value);
  }

  chooseProjectType(type: projectTypeEnum) {
    this.project.projectType = type;
    if (type === projectTypeEnum.retainer) {
      this.newProjectStepSignal.set(this.newProjectStepSignal() + 1);
    } else {
      this.newProjectStepSignal.set(5);
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
          this.newProjectStepSignal.set(2);
          this.submitted = false;
        }
        break;
      case 4:
        if (this.project.reccuringPayment && !(this.project.paymentModel === paymentModelEnum.monthly && !this.project.monthlyPaymentDay)) {
          this.newProjectStepSignal.set(5);
        }
        break;
      case 5:
        this.newProjectStepSignal.set(0);
        this.dialogRef.close(this.project);
        break;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
