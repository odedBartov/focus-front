import { Component, inject } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-management',
  imports: [FormsModule],
  templateUrl: './admin-management.component.html',
  styleUrl: './admin-management.component.scss'
})
export class AdminManagementComponent {
  httpService = inject(HttpService);
  email = "";

  giveBonusDayes() {
    this.httpService.giveUserBonusSubscription(this.email).subscribe(res => {
      alert("הפעולה בוצעה בהצלחה");
    }, err => {
      alert(err.error);
    });
  }
}
