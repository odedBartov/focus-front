import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpService } from '../services/http.service';
import { Feature } from '../models/feature';
import { Insight } from '../models/insight';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-updates',
  imports: [CommonModule],
  templateUrl: './updates.component.html',
  styleUrl: './updates.component.scss'
})
export class UpdatesComponent implements OnInit {
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  features: Feature[] = [];
  insight: Insight = new Insight();

  ngOnInit(): void {
    this.loadingService.changeIsloading(true);
    this.httpService.getInsightAndUpdates().subscribe(res => {
      this.loadingService.changeIsloading(false);
      this.insight = res.insight ?? new Insight();
      this.features = res.updates;
    })
  }
}
