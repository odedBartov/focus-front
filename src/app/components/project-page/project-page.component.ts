import { AfterViewInit, ChangeDetectorRef, Component, effect, ElementRef, EventEmitter, HostListener, inject, OnInit, Output, QueryList, ViewChild, ViewChildren, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from '../../models/project';
import { HttpService } from '../../services/http.service';
import { CommonModule } from '@angular/common';
import { Step } from '../../models/step';
import { AnimationsService } from '../../services/animations.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../../modals/confirmation-modal/confirmation-modal.component';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NewStepComponent } from '../new-step/new-step.component';
import { ProjectStatus, StepType, subscriptionEnum } from '../../models/enums';
import { ProjectModalComponent } from '../../modals/project-modal/project-modal.component';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NotesComponent } from '../notes/notes.component';
import { ProjectHoverService } from '../../services/project-hover.service';
import { RichTextComponent } from "../rich-text/rich-text.component";
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { ProjectsService } from '../../services/projects.service';
import { AuthenticationService } from '../../services/authentication.service';
import { AutoResizeInputDirective } from '../../helpers/autoResizeInputDirectory';
import { StepTask } from '../../models/stepTask';
import { AnimationItem } from 'lottie-web';

@Component({
  selector: 'app-project-page',
  imports: [CommonModule, MatDialogModule, FormsModule, MatTooltipModule, DragDropModule, NewStepComponent, NotesComponent, RichTextComponent, LottieComponent, AutoResizeInputDirective],
  templateUrl: './project-page.component.html',
  styleUrl: './project-page.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        // overflow: 'hidden',
        marginTop: '0px'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        // overflow: 'hidden', i removed this for animation
        marginTop: '16px'
      })),
      transition('collapsed <=> expanded', [
        animate('200ms ease')
      ]),
    ])
  ]
})
export class ProjectPageComponent implements OnInit, AfterViewInit {
  route = inject(ActivatedRoute);
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  dialog = inject(MatDialog);
  projectHoverService = inject(ProjectHoverService);
  projectsService = inject(ProjectsService);
  authenticationService = inject(AuthenticationService);
  @Output() navigateToHomeEmitter = new EventEmitter<void>();
  @ViewChild('stepsContainer', { static: false }) stepsContainer?: ElementRef;
  @ViewChild('newStepDiv', { static: false }) newStepDiv?: ElementRef;
  @ViewChild('notesDiv', { static: false }) notesDiv?: ElementRef;
  @ViewChild('richTextDiv', { static: false }) richTextDiv?: ElementRef;
  @ViewChild('addStepDiv', { static: false }) addStepDiv!: ElementRef;
  @ViewChildren('descriptions') descriptions!: QueryList<ElementRef<HTMLTextAreaElement>>;
  @ViewChildren('stepHeader') stepHeaders!: QueryList<ElementRef<HTMLSpanElement>>;
  editDiv?: HTMLDivElement;
  stepTypeEnum = StepType;
  project!: WritableSignal<Project>;
  projectId: string | null = null;
  activeStepId? = '';
  isReadOnly!: WritableSignal<boolean>;
  isShowNewStep = false;
  editStepId: string | undefined = '';
  hoverStepId? = '';
  showNotes = false;
  baseProjectPrice = 0;
  paidMoney = 0;
  lottieOptions: AnimationOptions = {
    path: '/assets/animations/stage-end.json',
    loop: false,
  };
  finishStepAnimationItem?: AnimationItem;
  animatingItemId?: string = '';
  hideProperties = this.projectHoverService.getSignal();
  animationHackFlag = true;
  mouseDownInside = false;

  constructor(private changeDetectorRef: ChangeDetectorRef) {
    this.project = this.projectsService.getCurrentProject();

    effect(() => {
      const value = this.project();
      this.project.set(value); // ?

      if (value?.steps) {
        value.steps.sort((a, b) => a.positionInList - b.positionInList);
      }
      this.activeStepId = value?.steps?.find(s => !s.isComplete)?.id;

      this.calculatePayments();

      setTimeout(() => {
        this.setActiveStepHeight();
      }, 1);
    });
  }

  ngOnInit(): void {
    this.loadProject();
    this.isReadOnly = this.authenticationService.getIsReadOnly();
  }

  ngAfterViewInit(): void {
    this.setStepHeadersMargin();
    this.setActiveStepHeight();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newStepDiv?.nativeElement && !this.newStepDiv.nativeElement.contains(event.target)) {
      this.isShowNewStep = false;
    }

    if (!this.editDiv?.contains(event.target as Node) && !this.mouseDownInside) {
      if (this.editStepId != '' && this.activeStepId === this.editStepId) {
        setTimeout(() => {
          this.setActiveStepHeight();
        }, 1);
      }
      this.editStepId = '';
    } else {
      this.mouseDownInside = true;
    }

    if (this.notesDiv?.nativeElement &&
      !this.notesDiv.nativeElement.contains(event.target) &&
      !this.richTextDiv?.nativeElement.contains(event.target)) {
      this.showNotes = false;
      this.projectHoverService.projectHover();
    }

    this.mouseDownInside = false;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    const isSpace = event.code === 'Space' || event.key === ' ';

    if (isSpace && this.addStepDiv?.nativeElement) {
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.hasAttribute('contenteditable')
      )) {
        return;
      }
      this.addStepDiv.nativeElement.focus();
    }
  }

  finishStepAnimationCreated(animation: AnimationItem) {
    this.finishStepAnimationItem = animation;
  }

  setStepHeadersMargin() {
    // this.stepHeaders.forEach((span, index) => {
    //   const el = span.nativeElement;
    //   const computedStyle = getComputedStyle(el);
    //   let lineHeight = parseFloat(computedStyle.lineHeight);
    //   if (isNaN(lineHeight)) {
    //     const fontSize = parseFloat(computedStyle.fontSize);
    //     lineHeight = fontSize * 1.2;
    //   }

    //   const lines = el.offsetHeight / lineHeight;
    //   if (lines > 2) { // if text is overflowing
    //     const finishedSteps = this.project().steps.filter(s => s.isComplete).length;
    //     const description = this.descriptions.get(index-finishedSteps)?.nativeElement;
    //     if (description) {
    // setTimeout(() => {
    //   console.log(description);
    //   description.style.marginTop = 20 * (lines - 1) + 'px';
    // }, 100);
    //     }
    //   }
    // })
  }

  setActiveStepHeight(extraHeight = 20) {
    const element = this.descriptions.get(0)?.nativeElement as HTMLTextAreaElement;
    if (element) {
      // const scrollHeight = element.nativeElement.scrollHeight;
      // const actualHeight = element.nativeElement.clientHeight;
      // const gap = (actualHeight + extraHeight) - scrollHeight;

      // let epsilon = 0;
      // if (gap > 0) {
      //   epsilon = gap;
      // }
      element.style.height = 'auto';
      // element.nativeElement.style.height = 20 + "px";
      element.style.height = element.scrollHeight + 'px';
      ;
    }
  }

  hoverStep(stepId: string | undefined, index: number) {
    this.hoverStepId = stepId;

    const finishedSteps = this.project()?.steps.filter(s => s.isComplete).length;
    if (finishedSteps !== undefined) {
      this.setDescriptionHeight(index - finishedSteps);
    }
  }

  setDescriptionHeight(index: number) {
    const element = this.descriptions.get(index);
    if (element) {
      const currentHeight = Number.parseInt(element.nativeElement.style.height);
      const scrollHeight = element.nativeElement.scrollHeight;

      if (Number.isNaN(currentHeight) || currentHeight < scrollHeight || currentHeight > scrollHeight) {
        element.nativeElement.style.height = scrollHeight + "px";
      }
    }
  }

  updateStepsPosition() {
    if (this.project()?.steps) {
      for (let index = 0; index < this.project()?.steps.length; index++) {
        this.project().steps[index].positionInList = index;
      }
    }
  }

  dropStep(event: CdkDragDrop<string[]>) {
    if (this.project()?.steps) {
      moveItemInArray(this.project().steps, event.previousIndex, event.currentIndex);
      this.updateStepsPosition();
      this.animationHackFlag = false;
      setTimeout(() => { // stupid angular animation
        this.animationHackFlag = true;
        this.activeStepId = this.project()?.steps?.find(s => !s.isComplete)?.id;
      });

      this.animationsService.changeIsLoadingWithDelay();
      setTimeout(() => {
        this.setActiveStepHeight();
      }, 1);
      this.httpService.updateSteps(this.project().steps).subscribe(res => {
        this.animationsService.changeIsloading(false);
      })
    }
  }

  loadProject() {
    if (this.projectId) {
      this.animationsService.changeIsloading(true);
      this.httpService.getProject(this.projectId).subscribe(res => {
        if (res.steps) {
          this.project.set(res);
          if (this.project()?.steps) {
            this.project().steps = this.project().steps.sort((a, b) => a.positionInList - b.positionInList);
          }
          this.activeStepId = res.steps.find(s => !s.isComplete)?.id;
          this.animationsService.changeIsloading(false);
        }
      });
    }
  }

  calculatePayments() {
    this.baseProjectPrice = 0;
    this.paidMoney = 0;
    this.project()?.steps?.forEach(step => {
      if (step.stepType === StepType.payment) {
        this.baseProjectPrice += step.price;
        if (step.isComplete) {
          this.paidMoney += step.price;
        }
      }
    });
  }

  updateCient() {
    if (this.project) {
      this.project().updateClient = !this.project().updateClient;
    }
  }

  changeStepStatus(step: Step) {
    this.animatingItemId = !step.isComplete ? step.id : undefined;
    this.changeDetectorRef.detectChanges(); // Ensure the view is updated before the animation starts
    setTimeout(() => {
      this.playLottieAnimation().then(() => {
        this.animatingItemId = '';
        step.isComplete = !step.isComplete;
        if (step.isComplete) {
          step.dateCompleted = new Date();
          if (this.project()) {
            let finishedSteps = 0;
            let notFinishedSteps = 0;
            for (let index = 0; index < this.project().steps.length; index++) {
              const currentStep = this.project().steps[index];
              if (currentStep.isComplete) {
                if (currentStep.id !== step.id) {
                  finishedSteps++;
                } else {
                  break;
                }
              } else {
                notFinishedSteps++;
              }
            }

            moveItemInArray(this.project().steps, finishedSteps + notFinishedSteps, finishedSteps);
            this.updateStepsPosition();
          }
        } else {
          step.dateCompleted = undefined;
          let passedStep = false;
          let stepsToMove = 0;
          let currentIndex = 0;
          if (this.project) {
            for (let index = 0; index < this.project().steps.length; index++) {
              const currentStep = this.project().steps[index];
              if (currentStep.id === step.id) {
                passedStep = true;
                currentIndex = index;
              } else {
                if (currentStep.isComplete) {
                  if (passedStep) {
                    stepsToMove++;
                  }
                } else {
                  break;
                }
              }
            }
            moveItemInArray(this.project().steps, currentIndex, currentIndex + stepsToMove);
            this.updateStepsPosition();
          }
        }

        this.activeStepId = this.project()?.steps?.find(s => !s.isComplete)?.id;
        this.updateStep(step);
      })
    }, 1);
  }

  updateStep(step: Step) {
    this.animationsService.changeIsLoadingWithDelay();
    this.httpService.updateSteps([step]).subscribe(res => {
      if (this.project().steps) {
        this.project().steps = this.project()?.steps?.map(step =>
          step.id === res[0].id ? res[0] : step
        )
      }
      this.editStepId = '';
      this.calculatePayments();
      setTimeout(() => {
        this.hoverStepId = '';
        if (step.id === this.activeStepId) {
          this.setActiveStepHeight(0);
          this.setStepHeadersMargin()
        }
      }, 1);
      this.animationsService.changeIsloading(false);
      this.isFinishProject();
    })
  }

  playLottieAnimation(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.finishStepAnimationItem) {
        resolve();
        return;
      }

      const onComplete = () => {
        this.finishStepAnimationItem?.removeEventListener('complete', onComplete);
        resolve();
      };

      if (!this.animatingItemId) {
        resolve();
        return;
      }
      this.finishStepAnimationItem.addEventListener('complete', onComplete);
      this.finishStepAnimationItem.play();
    });
  }


  toggleTask(step: Step, task: StepTask) {
    task.isComplete = !task.isComplete;
    this.httpService.updateSteps([step]).subscribe(res => { })
  }

  isFinishProject() {
    const stepsInProgress = this.project()?.steps.filter(s => !s.isComplete).length;
    if (stepsInProgress === 0) {
      const updatedProject = { ...this.project() };
      updatedProject.status = ProjectStatus.finished;
      this.project.set(updatedProject);
      this.animationsService.showFinishProject();
      const activeProjects = this.projectsService.getActiveProjects();
      const unActiveProjects = this.projectsService.getUnActiveProjects();
      let activeProjectIndex = -1;
      for (let index = 0; index < activeProjects().length; index++) {
        const element = activeProjects()[index];
        if (element.id === this.project().id) {
          activeProjectIndex = index;
          break;
        }
      }
      if (activeProjectIndex > -1) {
        unActiveProjects.set(unActiveProjects().concat(this.project()));
        activeProjects().splice(activeProjectIndex, 1);
      }
      this.httpService.updateProjects([this.project()]).subscribe(res => {
      });
      this.navigateToHomeEmitter.emit();
    }
  }

  openProjectModal() {
    const dialogRef = this.dialog.open(ProjectModalComponent, { data: { project: this.project() } });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.project.set(res);
      }
    })
  }

  showNewStep() {
    this.isShowNewStep = true;
    this.scrollToBottom();
  }

  showDeleteStepModal(step: Step) {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, { data: step.name });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.deleteStep(step);
      }
    })
  }

  createNewStep(step: Step) {
    this.animationsService.changeIsloading(true);
    step.projectId = this.project()?.id;
    step.positionInList = (this.project()?.steps?.length ?? 0) + 1;
    this.httpService.createStep(step).subscribe(res => {
      this.project()?.steps?.push(res);
      this.isShowNewStep = false;
      this.calculatePayments();
      this.animationsService.changeIsloading(false);
    })
  }

  editStep(div: HTMLDivElement, stepId: string | undefined) {
    this.editDiv = div;
    this.editStepId = stepId;
  }

  deleteStep(step: Step) {
    if (step.id) {
      this.animationsService.changeIsLoadingWithDelay();
      const stepIndex = this.project()?.steps?.indexOf(step);
      if (stepIndex !== undefined) {
        this.project()?.steps?.splice(stepIndex, 1);
        this.calculatePayments();
      }
      this.httpService.deleteStep(step.id).subscribe(res => {
        this.animationsService.changeIsloading(false);
      });
    }
  }

  showNotesPopup(show: boolean) {
    this.showNotes = show;
    this.projectHoverService.projectHover('empty');
  }

  scrollToBottom() {
    const container = this.stepsContainer?.nativeElement;
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 1);
  }
}
