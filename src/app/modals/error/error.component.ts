import { AfterViewInit, Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-error',
  imports: [],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss'
})
export class ErrorComponent implements AfterViewInit {
  dialogRef = inject(MatDialogRef<ErrorComponent>);
  authenticationService = inject(AuthenticationService);
  OdedsNumber = "972584046213";
  fullName = "משתמש ללא שם";
  
  ngAfterViewInit(): void {
    const userName = this.authenticationService.getUserName();
    if (userName) { 
      this.fullName = userName;
    }
  }

  openWhatsapp() {
    const message = `הי, זה ${this.fullName}. אני משתמש בפוקוס ונתקלתי בבעיה.
    הנה הסבר מפורט של התקלה והצעדים שעשיתי שהובילו אליה:
    `;
    const url = `https://wa.me/${this.OdedsNumber}?text=${message}`;
    window.open(url, '_blank');
  }

  closeModal() {
    this.dialogRef.close();
  }
}
