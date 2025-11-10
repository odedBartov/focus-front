import { Component, Input, WritableSignal } from '@angular/core';
import { ProjectLinksComponent } from '../project-links/project-links.component';
import { Project } from '../../models/project';
import { AiChatComponent } from '../ai-chat/ai-chat.component';
import { RichTextComponent } from '../rich-text/rich-text.component';

@Component({
  selector: 'app-open-notes',
  imports: [ProjectLinksComponent, AiChatComponent, RichTextComponent],
  templateUrl: './open-notes.component.html',
  styleUrl: './open-notes.component.scss'
})
export class OpenNotesComponent {
  @Input() project!: WritableSignal<Project>;
}
