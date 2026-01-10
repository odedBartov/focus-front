import { Component, inject, Input, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project';
import { MatTooltipModule } from '@angular/material/tooltip';
import { paymentModelEnum, ProjectStatus, projectTypeEnum, recurringDateTypeEnum, StepType } from '../../models/enums';
import { Step } from '../../models/step';
import { HourlyWorkSession } from '../../models/hourlyWorkSession';

@Component({
  selector: 'app-summary',
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent implements OnInit {
  authService = inject(AuthenticationService);
  steps: Step[] = [];
  @Input() set projects(projects: Project[]) {
    this.steps = [];
    this.updatedProjects = projects;
    projects.forEach(project => {
      if (project.status === ProjectStatus.active && !(project.projectType === projectTypeEnum.retainer && project.paymentModel === paymentModelEnum.hourly)) {
        this.steps = this.steps.concat(project.steps);
      } else if (project.status !== ProjectStatus.frozen && project.status !== ProjectStatus.deleted) {
        const finishedSteps = project.steps.filter(s => s.isComplete);
        this.steps = this.steps.concat(finishedSteps);
      }
    });
    // this.initChart();    
    this.initDynamicChart();
  }
  updatedProjects: Project[] = [];
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
  graphScales: number[] = [1000, 2000, 5000, 10000, 20000, 50000];
  monthsInGraph = 7;

  ngOnInit(): void {
    this.initCoffeePicture();
    this.userName = this.authService.getFirstName();
    this.calculateCoffeeRotation();
    // this.initChart();
    //this.initDynamicChart();    
  }

  // initChart() {
  //   const today = new Date();
  //   const todayMonth = today.getMonth();
  //   const todayYear = today.getFullYear();
  //   const filteredMonths = [];
  //   const half = Math.floor(this.monthsInGraph / 2);
  //   const paymentSteps = this.steps.filter(s => s && s.stepType === StepType.payment) as Step[];
  //   this.graphMonths = [];
  //   for (let index = 0; index < this.monthsInGraph; index++) {
  //     const offset = half - index;
  //     const targetDate = new Date(todayYear, todayMonth + offset, 1);
  //     this.graphMonths.push(this.getMonthForChart(targetDate.getMonth()+1));
  //     if (offset > 0) {
  //       filteredMonths[index] = paymentSteps.filter(s => this.compareYearAndMonth(s.dateDue, targetDate) && !s.isComplete);
  //       this.pastPayments[index] = 0;
  //       this.futurePayments[index] = filteredMonths[index].reduce((sum, step) => sum + step.price, 0);
  //     } else if (offset < 0) {
  //       filteredMonths[index] = paymentSteps.filter(s => this.compareYearAndMonth(s.dateCompleted, targetDate) && s.isComplete);
  //       this.pastPayments[index] = filteredMonths[index].reduce((sum, step) => sum + (step.isComplete ? step.price : 0), 0);
  //       this.futurePayments[index] = 0;
  //     } else {
  //       filteredMonths[index] = paymentSteps.filter(s => this.compareYearAndMonth(s.dateCompleted, targetDate) || (!s.isComplete && this.compareYearAndMonth(s?.dateDue, targetDate)));
  //       this.pastPayments[index] = filteredMonths[index].reduce((sum, step) => sum + (step.isComplete ? step.price : 0), 0);
  //       this.futurePayments[index] = filteredMonths[index].reduce((sum, step) => sum + (!step.isComplete ? step.price : 0), 0);
  //     }
  //   }

  //   this.calculateMonthlyRetainerPayments(paymentSteps);
  //   this.calculateHourlyRetainerPayments();

  //   this.calculateGraphScale();
  // }

  initDynamicChart() {
    const half = Math.floor(this.monthsInGraph / 2);
    const today = new Date();

    // Initialize/Reset arrays
    this.graphMonths = [];
    this.pastPayments = [];
    this.futurePayments = [];

    const paymentSteps = this.steps.filter(s => s && s.stepType === StepType.payment) as Step[];

    for (let i = 0; i < this.monthsInGraph; i++) {
      // Offset calculates the distance from today. 
      // If totalMonths is 7: i=0 is offset +3 (Future), i=3 is offset 0 (Today), i=6 is offset -3 (Past)
      const offset = half - i;
      const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);

      // 1. Set the Label
      this.graphMonths[i] = this.getMonthForChart(today.getMonth() + offset + 1);

      // 2. Filter steps for this specific month
      const monthsSteps = paymentSteps.filter(s => {
        if (offset > 0) {
          // Future Months: Look for incomplete items due in that month
          return this.compareYearAndMonth(s.dateDue, targetDate) && !s.isComplete;
        } else if (offset === 0) {
          // Current Month: Items completed this month OR items due this month but not complete
          return this.compareYearAndMonth(s.dateCompleted, today) ||
            (!s.isComplete && this.compareYearAndMonth(s.dateDue, today));
        } else {
          // Past Months: Look for items completed in that month
          return this.compareYearAndMonth(s.dateCompleted, targetDate) && s.isComplete;
        }
      });

      // 3. Sum the payments
      this.pastPayments[i] = monthsSteps.reduce((sum, s) => sum + (s.isComplete ? s.price : 0), 0);
      this.futurePayments[i] = monthsSteps.reduce((sum, s) => sum + (!s.isComplete ? s.price : 0), 0);
    }
    this.calculateMonthlyRetainerPayments(paymentSteps);
    this.calculateHourlyRetainerPayments();
    this.calculateGraphScale();
  }

  getMonthForChart(delta: number) {
    if (delta < 1) delta += 12;
    return Math.floor(delta % 13 + delta / 13);
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
    const res = (value / (this.futurePayments[index] > 0 ? this.futurePayments[index] + value : 1)) * 100;
    return res;

  }

  getFutureGraphValue(index: number): number {
    let value = this.pastPayments[index] + this.futurePayments[index];
    const res = (value / this.maxGraphValue) * 100;
    return res
  }

  calculateMonthlyRetainerPayments(paymentSteps: Step[]) {
    if (this.updatedProjects) {
      this.updatedProjects.forEach(project => {
        if (project.projectType === projectTypeEnum.retainer && project.paymentModel === paymentModelEnum.monthly && project.status === ProjectStatus.active) {
          for (let index = 0; index < Math.floor(this.futurePayments.length / 2); index++) {
            this.futurePayments[index] += project.reccuringPayment ?? 0;
          }
        }
      });

    }

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    paymentSteps.forEach(step => {
      if (step.isComplete &&
        step.stepType === StepType.payment &&
        step.isRecurring &&
        step.recurringDateType === recurringDateTypeEnum.month &&
        step.dateCompleted) {
        const dateCompleted = new Date(step.dateCompleted);
        if (dateCompleted < startOfThisMonth) {
          this.futurePayments[Math.floor(this.futurePayments.length / 2)] += step.price;
        }
      }
    });
  }

  calculateHourlyRetainerPayments() {
    const today = new Date();
    this.updatedProjects.forEach(project => {
      if (project.projectType === projectTypeEnum.retainer && project.paymentModel === paymentModelEnum.hourly) {
        let finishedPayments = project.steps.filter(s => s.stepType === StepType.payment && s.isComplete).reduce((a, b) => a += b.price, 0);
        project.hourlyWorkSessions.forEach(session => {
          const sessionPayment = Math.round((session.workTime / 3600000) * (project.reccuringPayment ?? 0));
          this.futurePayments[Math.floor(this.futurePayments.length / 2)] += sessionPayment;
        });
        this.futurePayments[Math.floor(this.futurePayments.length / 2)] -= finishedPayments;
      }
    });
  }

  calculateGraphScale() {
    const maxPast = Math.max(...this.pastPayments);
    const maxFuture = Math.max(...this.futurePayments);
    const todaySum = this.pastPayments[Math.floor(this.pastPayments.length / 2)] + this.futurePayments[Math.floor(this.futurePayments.length / 2)];
    const maxPayment = Math.max(maxPast, maxFuture, todaySum);
    const maxScale = this.graphScales.find(n => n > maxPayment);
    this.maxGraphValue = maxScale ?? 1;
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

  tooltipText(i: number) {
    const half = Math.floor(this.monthsInGraph / 2);
    if (i < half) {
      return 'הכנסות צפויות: ' + this.futurePayments[i] + ' ₪';
    } else if (i == half) {
      return 'הכנסות: ' + this.pastPayments[i] + ' ₪\n' + 'הכנסות צפויות: ' + this.futurePayments[i] + ' ₪\n' + 'סך הכל: ' + (this.pastPayments[i] + this.futurePayments[i]) + ' ₪';
    } else {
      return 'הכנסות: ' + this.pastPayments[i] + ' ₪';
    }
  }


  monthDiffCalendar(from: Date, to: Date = new Date()): number {
    const a = to.getFullYear() * 12 + to.getMonth();
    const b = from.getFullYear() * 12 + from.getMonth();
    return a - b;
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
