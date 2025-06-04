import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Editor, NgxEditorModule } from 'ngx-editor';
import { debounceTime, of, Subject, Subscription, switchMap } from 'rxjs';
import { Project } from '../../models/project';
import { HttpService } from '../../services/http.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rich-text',
  imports: [NgxEditorModule, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './rich-text.component.html',
  styleUrl: './rich-text.component.scss'
})
export class RichTextComponent implements OnDestroy, OnChanges, OnInit {
  @Input() project?: Project;
  @Input() expanded?: boolean;
  httpService = inject(HttpService);
  ritchTextSubject = new Subject<string>();
  editor = new Editor();
  editorControl = new FormControl('');
  private valueChangesSub!: Subscription;

  ngOnInit(): void {
    this.initEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project'] && this.project) {
      setTimeout(() => {
        if (this.project) {
          this.editor.setContent(this.project.notes)
        }
      }, 1);
    }
  }

  ngOnDestroy(): void {
    this.editor.destroy();
    this.valueChangesSub?.unsubscribe();
  }

  editorChanged(value: string) {
    if (value !== this.project?.notes) {
      this.ritchTextSubject.next(value);
    }
  }

  initEditor() {
    this.valueChangesSub = this.ritchTextSubject.pipe(debounceTime(1000),
      switchMap(text => {
        if (this.project) {
          this.project.notes = text;
          return this.httpService.updateProjects([this.project])
        } else {
          return of(undefined);
        }
      })
    ).subscribe(results => { });
  }

  toggleParagraph(): void {
    const { state, dispatch } = this.editor.view;
    const tr = state.tr;
    let modified = false;

    // Traverse the document to remove inline marks and convert headings
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        // Convert heading to paragraph
        tr.setNodeMarkup(pos, state.schema.nodes['paragraph']);
        modified = true;
      }
      if (node.isText && node.marks.length > 0) {
        // Remove all inline marks (e.g., bold, italic, etc.)
        tr.removeMark(pos, pos + node.nodeSize, null);
        modified = true;
      }
    });

    if (modified) {
      dispatch(tr);
    }

    // Focus the editor
    this.editor.commands.focus().exec();
  }

  toggleBold(): void {
    this.executeCommandWithSelectionPreservation(commands => commands.toggleBold().exec());
  }

  toggleBulletList(): void {
    this.executeCommandWithSelectionPreservation(commands => commands.toggleBulletList().exec());
  }

  toggleOrderedList(): void {
    this.executeCommandWithSelectionPreservation(commands => commands.toggleOrderedList().exec());
  }

  setHeading(level: 1 | 2 | 3): void {
    this.executeCommandWithSelectionPreservation(commands => commands.toggleHeading(level).exec());
  }

  private executeCommandWithSelectionPreservation(command: (editor: any) => any): void {
    const view = this.editor.view;
    const { state } = view;
    const { selection } = state;

    command(this.editor.commands);
    // Restore the selection
    view.focus();
    // view.dispatch(view.state.tr.setSelection(selection));
  }
}
