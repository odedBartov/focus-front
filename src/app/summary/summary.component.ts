import { Component, inject, Input, OnInit } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { CommonModule } from '@angular/common';
import { Project } from '../models/project';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CircleSegmentComponent } from '../circle-segment/circle-segment.component';

@Component({
  selector: 'app-summary',
  imports: [CommonModule, MatTooltipModule, CircleSegmentComponent ],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent implements OnInit {
  authService = inject(AuthenticationService);
  @Input() projects: Project[] = [];
  coffeePictures = [
    'assets/pictures/coffee_1.png',
    'assets/pictures/coffee_2.png',
    'assets/pictures/coffee_3.png',
    'assets/pictures/coffee_4.png',
    'assets/pictures/coffee_5.png',
    'assets/pictures/coffee_6.png',
  ]
  coffeePicture = this.coffeePictures[0];
  userName: string | null = '';
  coffeeRotation = 0;
  
  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    this.calculateCoffeeRotation();
  }

  startCoffeeRotationCalculation() {
    this.calculateCoffeeRotation();
    setInterval(() => {
      this.calculateCoffeeRotation();
    }, 60000);
  }

  calculateCoffeeRotation() {
    const currentTime = new Date();
      const hour = currentTime.getHours() % 12;
      const minutes = currentTime.getMinutes();
      const hourDegree = hour * 30;
      const minutesDegree = (minutes / 60) * 30;
      this.coffeeRotation = hourDegree + minutesDegree;
  }

  getRandomCoffee() {
    const oldCoffee = this.coffeePicture;
    while (oldCoffee === this.coffeePicture) { 
      const randomcoffee = this.coffeePictures[Math.floor(Math.random() * this.coffeePictures.length)];
      this.coffeePicture = randomcoffee;
    }
  }

  getGreeting() {
    return "בוקר טוב"// todo
  }
}
