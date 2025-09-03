import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { Feature } from '../../models/feature';
import { Insight } from '../../models/insight';
import { AnimationsService } from '../../services/animations.service';
import { AuthenticationService } from '../../services/authentication.service';
import { UpdatesService } from '../../services/updates.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-updates',
  imports: [CommonModule],
  templateUrl: './updates.component.html',
  styleUrl: './updates.component.scss'
})
export class UpdatesComponent implements OnInit {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  authenticationService = inject(AuthenticationService);
  updatesService = inject(UpdatesService)
  features: Feature[] = [];
  insight: Insight = new Insight();
  fullName = "משתמש ללא שם";
  arielsNumber = environment.arielsNumber;
  
  ngOnInit(): void {
    this.animationsService.changeIsloading(true);
    this.updatesService.getInsightAndUpdates().subscribe(res => {
      this.animationsService.changeIsloading(false);
      this.insight = res.insight ?? new Insight();
      this.features = res.updates;
    })

    const userName = this.authenticationService.getUserName();
    if (userName) { 
      this.fullName = userName;
    }
  }

  openWhatsapp() {
    const message = `הי, זה ${this.fullName}. אני משתמש בפוקוס ויש לי משהו להגיד:
    `;
    const url = `https://wa.me/${this.arielsNumber}?text=${message}`;
    window.open(url, '_blank');
  }
}
