import { Component, ElementRef, HostListener, inject, Input, ViewChild, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { CommonModule } from '@angular/common';
import { AnimationsService } from '../../services/animations.service';
import { HttpService } from '../../services/http.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-project-links',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './project-links.component.html',
  styleUrl: './project-links.component.scss'
})
export class ProjectLinksComponent {
  animationsService = inject(AnimationsService);
  httpService = inject(HttpService);
  authenticationService = inject(AuthenticationService);
  @Input() project?: Project;
  @ViewChild('newLinkDiv', { static: false }) newLinkDiv?: ElementRef;
  isReadOnly: WritableSignal<boolean>;
  hoveredLink = undefined;
  addingNewLink = false;
  submitted = false;
  formBuilder = inject(FormBuilder);
  form: FormGroup;

  constructor() {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      url: ['', [Validators.required]]
    });
    this.isReadOnly = this.authenticationService.getIsReadOnly();
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
      this.animationsService.changeIsLoadingWithDelay();
      this.httpService.updateProjects([this.project]).subscribe(res => {
        this.animationsService.changeIsloading(false);
      })
    }
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
      this.animationsService.changeIsloading(true);
      this.httpService.updateProjects([this.project]).subscribe(res => {
        this.animationsService.changeIsloading(false);
        this.addingNewLink = false;
        this.resetLinkForm();
      })
    }
  }

  openLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
