import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, inject, input, Input, OnChanges, OnDestroy, Output, output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Project } from '../models/project';
import { LoadingService } from '../services/loading.service';
import { HttpService } from '../services/http.service';
import { Editor, NgxEditorModule } from 'ngx-editor';
import { debounceTime, Subscription } from 'rxjs';
import { RichTextComponent } from "../rich-text/rich-text.component";

@Component({
  selector: 'app-notes',
  imports: [CommonModule, ReactiveFormsModule, NgxEditorModule, FormsModule, RichTextComponent],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss'
})
export class NotesComponent {
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
  

  constructor() {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      url: ['', [Validators.required]]
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newLinkDiv?.nativeElement) {
      if (!this.newLinkDiv.nativeElement.contains(event.target)) {
        this.addingNewLink = false;
      }
    }
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
