import { Component, OnInit } from '@angular/core';
import { StepType, stepTypeLabels } from '../models/enums';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-step',
  imports: [CommonModule],
  templateUrl: './new-step.component.html',
  styleUrl: './new-step.component.scss'
})
export class NewStepComponent implements OnInit {
  stepTypes: { text: string, icon: string, type: StepType }[] = []
  stepTypeLabels = stepTypeLabels;
  stepTypeEnum = StepType;
  selectedType?: StepType;

  ngOnInit(): void {
    this.stepTypes = [
      { text: "שלב בפרויקט שצריך לבצע", icon: "working", type: StepType.task },
      { text: "על ידי הלקוח", icon: "dollar", type: StepType.payment },
      { text: "חוזה, פגישה, אימייל חשוב וכו'", icon: "telegram", type: StepType.coomunication }
    ];

    this.selectedType = StepType.task// delete
  }

  selectType(type: StepType) {
    this.selectedType = type;
  }
}
