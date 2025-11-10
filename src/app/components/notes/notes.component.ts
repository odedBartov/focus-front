import { CommonModule } from '@angular/common';
import { Component, effect, inject, Input, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '../../models/project';
import { AnimationsService } from '../../services/animations.service';
import { HttpService } from '../../services/http.service';
import { NgxEditorModule } from 'ngx-editor';
import { RichTextComponent } from "../rich-text/rich-text.component";
import { AuthenticationService } from '../../services/authentication.service';
import { AiChatComponent } from '../ai-chat/ai-chat.component';
import { subscriptionEnum } from '../../models/enums';
import { PaidFeatureModalComponent } from '../../modals/paid-feature-modal/paid-feature-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ProjectsService } from '../../services/projects.service';
import { ProjectLinksComponent } from '../project-links/project-links.component';

@Component({
  selector: 'app-notes',
  imports: [CommonModule, NgxEditorModule, RichTextComponent, AiChatComponent, ProjectLinksComponent],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss'
})
export class NotesComponent {
  @Input() project!:  WritableSignal<Project>;
  router = inject(Router);
  animationsService = inject(AnimationsService);
  httpService = inject(HttpService);
  authenticationService = inject(AuthenticationService);
  projectService = inject(ProjectsService);
  isReadOnly!: WritableSignal<boolean>;
  submitted = false;
  tabSelected = 1;
  dialog = inject(MatDialog);
  openNotesSignal: WritableSignal<Project | undefined>;

  constructor() {
    this.openNotesSignal = this.projectService.getProjectWithOpenNotes();
    this.isReadOnly = this.authenticationService.getIsReadOnly();

    effect(() => {
      this.project();
    });
  }

  openAiChat() {
    const userSubscription = this.authenticationService.getSubscription();
    if (userSubscription === subscriptionEnum.full || userSubscription == subscriptionEnum.trial) { 
      this.tabSelected = 3;
    } else {
      this.dialog.open(PaidFeatureModalComponent);
    }
  }

  showNotes() {
    this.openNotesSignal.set(this.project());
  }
}
