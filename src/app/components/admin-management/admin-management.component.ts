import { AfterViewInit, Component, inject } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user';
import { subscriptionEnum } from '../../models/enums';

@Component({
  selector: 'app-admin-management',
  imports: [FormsModule],
  templateUrl: './admin-management.component.html',
  styleUrl: './admin-management.component.scss'
})
export class AdminManagementComponent implements AfterViewInit {
  httpService = inject(HttpService);
  bonusInput = "";
  deleteInput = "";
  freeUSers = 0;
  partialUsers = 0;
  fullUsers = 0;
  trialUsers = 0;

  giveBonusDayes() {
    this.httpService.giveUserBonusSubscription(this.bonusInput).subscribe(res => {
      alert("הפעולה בוצעה בהצלחה");
    }, err => {
      alert(err.error);
    });
  }

  ngAfterViewInit(): void {
    this.httpService.getAllUsers().subscribe((users: User[]) => {
      users.forEach(user => {
        switch (user.subscription) {
          case subscriptionEnum.free:
            this.freeUSers++;
            break;
          case subscriptionEnum.partial:
            this.partialUsers++;
            break;
          case subscriptionEnum.full:
            this.fullUsers++;
            break;
          case subscriptionEnum.trial:
            this.trialUsers++;
            break;
          default:
            break;
        }
      });
    });
  }

  deleteUser() {
    this.httpService.deleteUser(this.deleteInput).subscribe(res => {
      alert("הפעולה בוצעה בהצלחה");
    }, err => {
      alert(err.error);
    });
  }
}
