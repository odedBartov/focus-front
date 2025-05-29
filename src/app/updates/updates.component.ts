import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpService } from '../services/http.service';
import { Feature } from '../models/feature';
import { Insight } from '../models/insight';
import { LoadingService } from '../services/loading.service';
import { AuthenticationService } from '../services/authentication.service';
import { UpdatesService } from '../services/updates.service';

@Component({
  selector: 'app-updates',
  imports: [CommonModule],
  templateUrl: './updates.component.html',
  styleUrl: './updates.component.scss'
})
export class UpdatesComponent implements OnInit {
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  authenticationService = inject(AuthenticationService);
  updatesService = inject(UpdatesService)
  features: Feature[] = [];
  insight: Insight = new Insight();
  ArielsNumber = "";
  whatsappUrl = "";
  fullName = "משתמש ללא שם";

  ngOnInit(): void {
    this.loadingService.changeIsloading(true);
    this.updatesService.getInsightAndUpdates().subscribe(res => {
      this.loadingService.changeIsloading(false);
      this.insight = res.insight ?? new Insight();
      this.features = res.updates;
    })

    const userName = this.authenticationService.getUserName();
    if (userName) { 
      this.fullName = userName;
    }
  }

  openWhatsapp() {
    const message = `הי, זה ${this.fullName}. אני משתמש שלכם בפוקוס ויש לי משהו להגיד:
    `;
    const url = `https://wa.me/${this.ArielsNumber}?text=${message}`;
    window.open(url, '_blank');
  }
}
