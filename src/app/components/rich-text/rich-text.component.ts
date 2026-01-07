import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, WritableSignal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Editor, NgxEditorModule } from 'ngx-editor';
import { debounceTime, of, Subject, Subscription, switchMap } from 'rxjs';
import { Project } from '../../models/project';
import { HttpService } from '../../services/http.service';
import { CommonModule } from '@angular/common';
import { Plugin } from 'prosemirror-state';
import { AuthenticationService } from '../../services/authentication.service';
import { DOMParser as ProseMirrorDOMParser } from 'prosemirror-model';

@Component({
  selector: 'app-rich-text',
  imports: [NgxEditorModule, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './rich-text.component.html',
  styleUrl: './rich-text.component.scss'
})
export class RichTextComponent implements OnDestroy, OnChanges, OnInit, AfterViewInit {
  @ViewChild('editorWrapper', { read: ElementRef }) editorWrapper!: ElementRef;
  @Input() project?: Project;
  @Input() expanded?: boolean;
  httpService = inject(HttpService);
  authenticationService = inject(AuthenticationService);
  isReadOnly!: WritableSignal<boolean>;
  ritchTextSubject = new Subject<string>();
  editor = new Editor();
  editorControl: FormControl;
  private valueChangesSub!: Subscription;

  constructor() {
    this.isReadOnly = this.authenticationService.getIsReadOnly();
    this.editorControl = new FormControl({ value: '', disabled: this.isReadOnly() });
  }

  ngOnInit(): void {
    this.initEditor();
  }

  ngAfterViewInit(): void {
    const preserveHtmlPastePlugin = new Plugin({
      props: {
        handlePaste(view, event) {
          const html = event.clipboardData?.getData('text/html');
          const text = event.clipboardData?.getData('text/plain');

          // Nothing to paste
          if (!html && !text) return false;

          event.preventDefault();

          // Prefer HTML if available (keeps formatting)
          let htmlToUse = html || text;

          // If source HTML does not include line breaks as <br> or <p>,
          // convert raw \n characters to <br>
          if (text && !html) {
            htmlToUse = text.replace(/\r?\n/g, '<br>');
          }

          const parser = new DOMParser();
          const dom = parser.parseFromString(htmlToUse ?? '', 'text/html');

          const pmParser = ProseMirrorDOMParser.fromSchema(view.state.schema);
          const slice = pmParser.parseSlice(dom.body);

          const tr = view.state.tr.replaceSelection(slice);
          view.dispatch(tr);

          return true; // stop default paste
        },
      },
    });
    this.editor.registerPlugin(preserveHtmlPastePlugin);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project'] && this.project) {
      setTimeout(() => {
        if (this.project?.notes) {
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
    const view = this.editor.view;
    const { state, dispatch } = view;
    const { selection } = state;
    const { from, to } = selection;
    const tr = state.tr;
    let modified = false;

    // Apply changes only to the selected range
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === 'heading') {
        tr.setNodeMarkup(pos, state.schema.nodes['paragraph']);
        modified = true;
      }

      if (node.isText && node.marks.length > 0) {
        // Remove marks within selection bounds
        tr.removeMark(pos, pos + node.nodeSize, null);
        modified = true;
      }
    });

    if (modified) {
      dispatch(tr);
    }

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
    const originalSelection = state.selection;

    const transaction = state.tr.setSelection(originalSelection); // Preserve the original selection
    command(this.editor.commands);

    // Reapply the preserved selection and dispatch
    //const newState = view.state.apply(transaction);
    //view.updateState(newState);

    view.focus();
  }
}
