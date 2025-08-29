import { Component, inject, Input, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectStatus, StepType } from '../../models/enums';
import { Step } from '../../models/step';

@Component({
  selector: 'app-summary',
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent implements OnInit {
  authService = inject(AuthenticationService);
  @Input() steps: Step[] = [];
  @Input() set projects(projects: Project[]) {
    this.steps = [];
    projects.forEach(project => {
      if (project.status === ProjectStatus.active) {
        this.steps = this.steps.concat(project.steps);
      } else {
        const finishedSteps = project.steps.filter(s => s.isComplete);
        this.steps = this.steps.concat(finishedSteps);
      }
    });
    this.initChart();
  }
  greetings: { hour: number, greeting: string }[] = [{ hour: 5, greeting: 'לילה טוב' },
  { hour: 12, greeting: 'בוקר טוב' },
  { hour: 16, greeting: 'צהריים טובים' },
  { hour: 18, greeting: 'אחר צהריים טובים' },
  { hour: 22, greeting: 'ערב טוב' },
  { hour: 25, greeting: 'לילה טוב' }];
  coffeePictures = [
    'assets/pictures/coffee_1.png',
    'assets/pictures/coffee_2.png',
    'assets/pictures/coffee_4.png',
    'assets/pictures/coffee_5.png',
    'assets/pictures/coffee_6.png',
  ]
  static coffeePicture = '';
  static lastCoffeeTime?: Date;
  userName: string | null = '';
  coffeeRotation = 0;
  pastPayments: number[] = [];
  futurePayments: number[] = [];
  maxGraphValue = 1;
  graphMonths: number[] = [];
  isPayedHovered = false;
  hoverTimeout: any;
  graphScales: number[] = [10, 20, 40 , 60, 80, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
    1200, 1400, 1600, 1800, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7000, 8000, 9000, 10000,
    12000, 14000, 16000, 18000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 140000,
    160000, 180000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 600000, 700000, 800000, 900000, 1000000];

  ngOnInit(): void {
    this.initCoffeePicture();
    this.userName = this.authService.getFirstName();
    this.calculateCoffeeRotation();
    this.initChart();
  }

  initChart() {
    const today = new Date();
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const oneMonthFuture = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const twoMonthsFuture = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    this.graphMonths = [(today.getMonth() + 3) % 12, (today.getMonth() + 2) % 12, (today.getMonth() + 1) % 12, today.getMonth() % 12, (today.getMonth() - 1) % 12];

    const chartModel = this.steps;
    const paymentSteps = chartModel.filter(s => s && s.stepType === StepType.payment) as Step[];
    const filteredMonths = [];
    filteredMonths[0] = paymentSteps.filter(s => this.compareYearAndMonth(s.dateDue, twoMonthsFuture) && !s.isComplete);
    filteredMonths[1] = paymentSteps.filter(s => this.compareYearAndMonth(s.dateDue, oneMonthFuture) && !s.isComplete);
    filteredMonths[2] = paymentSteps.filter(s => this.compareYearAndMonth(s.dateCompleted, today) || (!s.isComplete && this.compareYearAndMonth(s?.dateDue, today)));
    filteredMonths[3] = paymentSteps.filter(s => this.compareYearAndMonth(s.dateCompleted, oneMonthAgo) && s.isComplete);
    filteredMonths[4] = paymentSteps.filter(s => this.compareYearAndMonth(s.dateCompleted, twoMonthsAgo) && s.isComplete);

    this.pastPayments[0] = 0;
    this.pastPayments[1] = 0;
    this.pastPayments[2] = filteredMonths[2].reduce((sum, step) => sum + (step.isComplete ? step.price : 0), 0);
    this.pastPayments[3] = filteredMonths[3].reduce((sum, step) => sum + step.price, 0);
    this.pastPayments[4] = filteredMonths[4].reduce((sum, step) => sum + step.price, 0);

    this.futurePayments[0] = filteredMonths[0].reduce((sum, step) => sum + step.price, 0);
    this.futurePayments[1] = filteredMonths[1].reduce((sum, step) => sum + step.price, 0);
    this.futurePayments[2] = filteredMonths[2].reduce((sum, step) => sum + (!step.isComplete ? step.price : 0), 0);
    this.futurePayments[3] = 0;
    this.futurePayments[4] = 0;

    this.calculateGraphScale();
  }

  initCoffeePicture() {
    const today = new Date();
    if (!SummaryComponent.lastCoffeeTime || (today.getDate() > SummaryComponent.lastCoffeeTime.getDate() && today.getMonth() >= SummaryComponent.lastCoffeeTime.getMonth())) {
      this.getRandomCoffee();
    }
  }

  get getCoffeePicture() {
    return SummaryComponent.coffeePicture;
  }

  compareYearAndMonth(first: Date | undefined | null, second: Date) {
    if (first) {
      const firstDate = new Date(first);
      return firstDate.getFullYear() === second.getFullYear() &&
        firstDate.getMonth() === second.getMonth()
    }
    return false;
  }

  getPastGraphValue(index: number) {
    let value = this.pastPayments[index];
    return (value / (this.futurePayments[index] > 0 ? this.futurePayments[index] + value : 1)) * 100;
  }

  getFutureGraphValue(index: number) {
    let value = this.pastPayments[index] + this.futurePayments[index];
    return (value / this.maxGraphValue) * 100;
  }

  calculateGraphScale() {
    const maxPast = Math.max(...this.pastPayments);
    const maxFuture = Math.max(...this.futurePayments);
    const todaySum = this.pastPayments[2] + this.futurePayments[2];
    const maxPayment = Math.max(maxPast, maxFuture, todaySum);
    const maxScale = this.graphScales.find(n => n > maxPayment);
    this.maxGraphValue = maxScale ?? 0;
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
    SummaryComponent.lastCoffeeTime = new Date();
    const oldCoffee = SummaryComponent.coffeePicture;
    while (oldCoffee === SummaryComponent.coffeePicture) {
      const randomcoffee = this.coffeePictures[Math.floor(Math.random() * this.coffeePictures.length)];
      SummaryComponent.coffeePicture = randomcoffee;
    }
  }

  getGreeting() {
    const currentHour = new Date().getHours();
    const greeting = this.greetings.find(g => g.hour > currentHour)?.greeting;
    return greeting;
  }

  onInnerEnter() {
    this.isPayedHovered = true;
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  onInnerLeave() {
    this.hoverTimeout = setTimeout(() => {
      this.isPayedHovered = false;
    }, 1);
  }
}
