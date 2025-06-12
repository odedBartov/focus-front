import { AfterViewInit, Component, inject } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { profession, User, userProfessionsWithText, UserStatus, userStatusesWithText } from '../../models/user';
import { CommonModule } from '@angular/common';
import { AnimationsService } from '../../services/animations.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements AfterViewInit {
  httpService = inject(HttpService);
  authenticationService = inject(AuthenticationService);
  animationsService = inject(AnimationsService);
  dialogRef = inject(MatDialogRef<ProfileComponent>);
  userStatuses = userStatusesWithText;
  userProfessions = userProfessionsWithText;
  defaultPicture = "assets/icons/default_profile.svg";
  user: User = new User();

  ngAfterViewInit(): void {
    this.animationsService.changeIsloading(true);
    this.httpService.getUser().subscribe(user => {
      this.user = user;      
      this.animationsService.changeIsloading(false);
    });
  }

  getProfilePicture() {
    const userPicture = this.authenticationService.getUserPicture();
    if (userPicture && userPicture != "") {
      return userPicture;
    }

    return this.defaultPicture;
  }

  selectStatus(status: any) {
    const parsedStatus = Number(status.value) as UserStatus;    
    this.user.status = parsedStatus;    
    this.updateUser();
  }

  selectProfession(profession: any) {
    const parsedProfession = Number(profession.value) as profession;
    this.user.profession = parsedProfession;
    this.updateUser();
  }

  updateUser() {
    this.httpService.updateUser(this.user).subscribe(res => { });
  }

  deleteAccount() {
    
  }

  logOut() {
    this.authenticationService.logOut();
    this.dialogRef.close();
  }
}
