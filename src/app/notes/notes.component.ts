import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notes',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss'
})
export class NotesComponent implements OnInit {
  router = inject(Router);
  formBuilder = inject(FormBuilder);
  @ViewChild('newLinkDiv', { static: false }) newLinkDiv?: ElementRef;
  form: FormGroup;
  links: {name: string, url: string}[] = [];
  notesSelected = false;
  hoveredLink = undefined;
  addingNewLing = false;
  submitted = false;

  constructor() {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      url: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.links = [{name: 'חתול', url: "https://i.natgeofe.com/n/548467d8-c5f1-4551-9f58-6817a8d2c45e/NationalGeographic_2572187_16x9.jpg?w=1200"},
                  {name: 'כלב', url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYdAyA3iUciFLZ5NUwn_cErsIb4tieQ1FnlA&s"},
                  {name: "יוטיוב", url: "https://www.youtube.com/"}
    ]
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newLinkDiv?.nativeElement) {
      if (!this.newLinkDiv.nativeElement.contains(event.target)) {
        this.addingNewLing = false;
      }
    }
  }

  hoverLink(link: any) {
    this.hoveredLink = link;
  }

  leaveLink() {
    this.hoveredLink = undefined;
  }

  deleteLink(link: {name: string, url: string}) {
    const index = this.links.indexOf(link);
    this.links.splice(index, 1);
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
    if (this.form.valid) {   
      const name = this.form.get("name")?.value;
      const url = this.form.get("url")?.value;
      this.links.push({name: name, url: url});
      this.addingNewLing = false;
      this.resetLinkForm();
    }
  }
}
