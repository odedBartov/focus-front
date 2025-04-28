import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-updates',
  imports: [CommonModule],
  templateUrl: './updates.component.html',
  styleUrl: './updates.component.scss'
})
export class UpdatesComponent implements OnInit {
  features!: string[];

  ngOnInit(): void {
    this.features = ["סתם טקסט בנוגע למאפיין שנוסיך בעתיד", "עוד טקסט הפעם יותר קצר", "בלה בלה בלה"];
  }
}
