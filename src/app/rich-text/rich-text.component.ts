import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Editor, NgxEditorModule } from 'ngx-editor';
import { debounceTime, Subscription } from 'rxjs';
import { Project } from '../models/project';
import { HttpService } from '../services/http.service';

@Component({
  selector: 'app-rich-text',
  imports: [NgxEditorModule, ReactiveFormsModule, FormsModule],
  templateUrl: './rich-text.component.html',
  styleUrl: './rich-text.component.scss'
})
export class RichTextComponent implements OnDestroy, OnChanges {
  @Input() project?: Project;
  httpService = inject(HttpService);
  editor = new Editor();
  editorControl = new FormControl('');
  private valueChangesSub!: Subscription;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project'] && this.project) {
      this.initEditor();
    }
  }

  ngOnDestroy(): void {
    this.editor.destroy();
    this.valueChangesSub?.unsubscribe();
  }

  initEditor() {
    if (this.project) {
      this.editorControl.setValue(this.project?.notes);
      this.valueChangesSub = this.editorControl.valueChanges.pipe(debounceTime(1000)).subscribe(content => {
        if (this.project) {
          this.project.notes = content ?? '';
          this.httpService.updateProjects([this.project]).subscribe(res => { })
        }
      });
    }
  }

  toggleBold(): void {
    this.editor.commands.toggleBold().focus().exec();
  }

  toggleBulletList(): void {
    this.editor.commands.toggleBulletList().focus().exec();
  }

  toggleOrderedList(): void {
    this.editor.commands.toggleOrderedList().focus().exec();
  }

  setHeading(level: 1 | 2 | 3): void {
    this.editor.commands.toggleHeading(level).focus().exec();
  }
}
