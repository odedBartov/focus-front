import { Component, inject, Input, OnInit } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { CommonModule } from '@angular/common';
import { Project } from '../models/project';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CircleSegmentComponent } from '../circle-segment/circle-segment.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { StepType } from '../models/enums';
import { Step } from '../models/step';
Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Title
);
@Component({
  selector: 'app-summary',
  imports: [CommonModule, MatTooltipModule, CircleSegmentComponent, BaseChartDirective],
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
  public barChartType: 'bar' = 'bar';
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Primary',
        data: [20000, 15000, 10000, 20000, 17000],
        backgroundColor: '#4A7CFF',
        stack: 'combined',
      },
      {
        label: 'Secondary',
        data: [5000, 5000, 15000, 0, 0],
        backgroundColor: '#D1DBF8',
        stack: 'combined',
      }
    ],
  };
  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        ticks: {
          stepSize: 10000,
        }
      }
    },
    plugins: {
      legend: { display: false },
    },
  };

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    this.calculateCoffeeRotation();
    this.initChart();
  }

  initChart() {
    const today = new Date();
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const oneMonthFuture = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const twoMonthsFuture = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    this.barChartData.labels = [(today.getMonth() + 3) % 12, (today.getMonth() + 2) % 12, (today.getMonth() + 1) % 12, today.getMonth() % 12, (today.getMonth() - 1) % 12];

    const chartModel = this.projects.map(p => p.steps).flat();
    const paymentSteps = chartModel.filter(s => s && s.stepType === StepType.payment) as Step[];
    const filteredMonths = [];
    filteredMonths[0] = paymentSteps.filter(s => this.compareYearAndMonth(s?.dateDue, twoMonthsFuture) && !s.isComplete);
    filteredMonths[1] = paymentSteps.filter(s => this.compareYearAndMonth(s?.dateDue, oneMonthFuture) && !s.isComplete);
    filteredMonths[2] = paymentSteps.filter(s => this.compareYearAndMonth(s?.dateCompleted, today) || this.compareYearAndMonth(s?.dateDue, today));
    filteredMonths[3] = paymentSteps.filter(s => this.compareYearAndMonth(s?.dateCompleted, oneMonthAgo) && s.isComplete);
    filteredMonths[4] = paymentSteps.filter(s => this.compareYearAndMonth(s?.dateCompleted, twoMonthsAgo) && s.isComplete);

    const primaries: number[] = [];
    primaries[0] = 0;
    primaries[1] = 0;
    primaries[2] = filteredMonths[2].reduce((sum, step) => sum + (step.isComplete ? step.price : 0), 0);
    primaries[3] = filteredMonths[3].reduce((sum, step) => sum + step.price, 0);
    primaries[4] = filteredMonths[4].reduce((sum, step) => sum + step.price, 0);

    const Secondaries: number[] = [];
    Secondaries[0] = filteredMonths[0].reduce((sum, step) => sum + step.price, 0);
    Secondaries[1] = filteredMonths[1].reduce((sum, step) => sum + step.price, 0);
    Secondaries[2] = filteredMonths[2].reduce((sum, step) => sum + (!step.isComplete ? step.price : 0), 0);
    Secondaries[3] = 0;
    Secondaries[4] = 0;

    this.barChartData.datasets = [{
      label: 'תשלום שהתבצע',
      data: primaries,
      backgroundColor: '#667AFF',
      stack: 'combined',
    }, {
      label: 'תשלום צפוי',
      data: Secondaries,
      backgroundColor: 'rgba(102, 122, 255, 0.3)',
      stack: 'combined',
    }];
  }

  compareYearAndMonth(first: Date | undefined, second: Date) {
    if (first) {   
      const firstDate = new Date(first);
      return firstDate.getFullYear() === second.getFullYear() &&
      firstDate.getMonth() === second.getMonth()
    }
    return false;
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
