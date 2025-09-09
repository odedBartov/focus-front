import { Component, ElementRef, inject, Input, OnInit, ViewChild, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-retainer-steps',
  imports: [CommonModule],
  templateUrl: './retainer-steps.component.html',
  styleUrl: './retainer-steps.component.scss'
})
export class RetainerStepsComponent implements OnInit {
  private authenticationService = inject(AuthenticationService);
  @Input() project!: Project;
  @ViewChild('stepsContainer', { static: false }) stepsContainer?: ElementRef;
  isReadOnly!: WritableSignal<boolean>;
  isShowNewStep = false;

  ngOnInit(): void {
    this.isReadOnly = this.authenticationService.getIsReadOnly();
  }

  showNewStep() {
    this.isShowNewStep = true;
    this.scrollToBottom();
  }

  scrollToBottom() {
    const container = this.stepsContainer?.nativeElement;
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 1);
  }
}
