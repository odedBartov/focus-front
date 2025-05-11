import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, inject, input, Input, OnChanges, OnDestroy, Output, output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Project } from '../models/project';
import { LoadingService } from '../services/loading.service';
import { HttpService } from '../services/http.service';
import { Editor, NgxEditorModule } from 'ngx-editor';
import { debounceTime, Subscription } from 'rxjs';

@Component({
  selector: 'app-notes',
  imports: [CommonModule, ReactiveFormsModule, NgxEditorModule, FormsModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss'
})
export class NotesComponent implements OnDestroy, OnChanges {
  @Input() project?: Project;
  @Input({ required: false }) notesPopup?: boolean;
  @Output() showNotesEmitter: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('newLinkDiv', { static: false }) newLinkDiv?: ElementRef;
  router = inject(Router);
  formBuilder = inject(FormBuilder);
  loadingService = inject(LoadingService);
  httpService = inject(HttpService);
  form: FormGroup;
  notesSelected = true;
  hoveredLink = undefined;
  addingNewLink = false;
  submitted = false;
  editor = new Editor();
  editorControl = new FormControl('');
  private valueChangesSub!: Subscription;

  constructor() {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      url: ['', [Validators.required]]
    });
  }

  ngOnDestroy(): void {
    this.editor.destroy();
    this.valueChangesSub?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newLinkDiv?.nativeElement) {
      if (!this.newLinkDiv.nativeElement.contains(event.target)) {
        this.addingNewLink = false;
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project'] && this.project) {
      this.initEditor();
    }
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

  hoverLink(link: any) {
    this.hoveredLink = link;
  }

  leaveLink() {
    this.hoveredLink = undefined;
  }

  deleteLink(link: { name: string, url: string }) {
    if (this.project) {
      const index = this.project.links.indexOf(link);
      this.project.links.splice(index, 1);
      this.loadingService.changeIsloading(true);
      this.httpService.updateProjects([this.project]).subscribe(res => {
        this.loadingService.changeIsloading(false);
      })
    }
  }

  openLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  resetLinkForm() {
    this.form.reset();
    this.submitted = false;
  }

  addLink() {
    this.submitted = true;
    if (this.form.valid && this.project) {
      const name = this.form.get("name")?.value;
      const url = this.form.get("url")?.value;
      if (!this.project.links) {
        this.project.links = [];
      }
      this.project.links.push({ name: name, url: url });
      this.loadingService.changeIsloading(true);
      this.httpService.updateProjects([this.project]).subscribe(res => {
        this.loadingService.changeIsloading(false);
        this.addingNewLink = false;
        this.resetLinkForm();
      })
    }
  }

  showNotes() {
    this.showNotesEmitter.emit(true);
  }
}
