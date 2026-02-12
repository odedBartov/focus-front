import { AfterViewInit, ChangeDetectorRef, Component, inject } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { profession, User, userProfessionsWithText, UserStatus, userStatusesWithText } from '../../models/user';
import { CommonModule } from '@angular/common';
import { AnimationsService } from '../../services/animations.service';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { subscriptionEnum } from '../../models/enums';
import { UserSubscription } from '../../models/userSubscription';
import { UserService } from '../../services/user.service';
import { taxManagementSystemEnum } from '../../models/taxSystem';
import { ConnectionToTaxComponent, taxSystemConnection } from '../../components/connection-to-tax/connection-to-tax.component';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, ConnectionToTaxComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements AfterViewInit {
  httpService = inject(HttpService);
  authenticationService = inject(AuthenticationService);
  userService = inject(UserService);
  animationsService = inject(AnimationsService);
  dialogRef = inject(MatDialogRef<ProfileComponent>);
  cd = inject(ChangeDetectorRef);
  userStatuses = userStatusesWithText;
  userProfessions = userProfessionsWithText;
  defaultPicture = "assets/icons/default_profile.svg";
  arielsNumber = "972584046213";
  fullName = "משתמש ללא שם";
  user: User = new User();
  subscriptionEnum = subscriptionEnum;
  userSubscriptions: UserSubscription[] = [
    { title: 'פוקוס בקטנה', subscription: subscriptionEnum.free, text: 'פרויקט פעיל אחד, ללא פיצ׳רים מתקדמים וללא תמיכה טכנית' },
    { title: 'פוקוס בצמיחה', subscription: subscriptionEnum.partial, text: 'עד 3 פרויקטים פעילים, ללא מנטור AI ואינטגרציות חכמות', price: '10 ₪ לחודש' },
    { title: 'פוקוס על מלא', subscription: subscriptionEnum.full, text: 'ללא מגבלת פרויקטים, פיצ׳רים מתקדמים ותמיכה טכנית', price: '30 ₪ לחודש' },
    { title: 'פוקוס על מלא', subscription: subscriptionEnum.full, text: 'ללא מגבלת פרויקטים, פיצ׳רים מתקדמים ותמיכה טכנית', price: 'גרסת נסיון' }
  ]
  currentUserSubscription: UserSubscription = this.userSubscriptions[0];
  taxManagemantStep = 1;
  taxManagementSystemEnum = taxManagementSystemEnum;
  wrongCredentialsError = false;

  ngAfterViewInit(): void {
    this.getUserSubscription();
    this.animationsService.changeIsloading(true);
    this.userService.getUser().subscribe(user => {
      this.user = user;
      this.animationsService.changeIsloading(false);
      this.handleUserTaxManagement();
    });
  }

  handleUserTaxManagement() {
    if (this.user.taxManagementApiKey) {
      this.taxManagemantStep = 3;
    }
  }

  getProfilePicture() {
    const userPicture = this.authenticationService.getUserPicture();
    if (userPicture && userPicture != "") {
      return userPicture;
    }

    return this.defaultPicture;
  }

  getUserSubscription() {
    const subscription = this.authenticationService.getSubscription();
    if (subscription === subscriptionEnum.trial) {
      this.currentUserSubscription = this.userSubscriptions[2];
    } else {
      this.currentUserSubscription = this.userSubscriptions.find(sub => sub.subscription === subscription) || this.userSubscriptions[0];
    }
    this.cd.detectChanges();
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
    this.userService.updateUser(this.user).subscribe(res => { });
  }

  navigateToSubscription() {
    window.location.href = environment.subscriptionUrl;
  }

  unSubscribe() {
    const message = `שלום, שמי ${this.user.firstName} ואני רוצה לבטל את המנוי שלי בפוקוס`;
    const url = `https://wa.me/${this.arielsNumber}?text=${message}`;
    window.open(url, '_blank');
  }

  logOut() {
    this.authenticationService.logOut();
    this.dialogRef.close();
  }

  connectToTaxManagement() {
    this.taxManagemantStep = 2;
  }

  updateTaxConnection(taxConnection: taxSystemConnection) {
    this.user.taxManagementApiKey = taxConnection.taxManagementApiKey;
    this.user.taxManagementSystem = taxConnection.taxManagementSystem;
    this.user.taxManagementCompanyId = taxConnection.taxManagementCompanyId;
    this.userService.updateUser(this.user).subscribe(res => { });
    this.taxManagemantStep = 3;
  }

  getTaxManagementName() {
    switch (this.user.taxManagementSystem) {
      case taxManagementSystemEnum.iCount:
        return "iCount";
      case taxManagementSystemEnum.morning:
        return "Morning";
      case taxManagementSystemEnum.sumit:
        return "Sumit";
      default:
        return "מערכת לא זוהתה";
    }
  }

  disconnectFromTaxManagement() {
    this.user.taxManagementApiKey = undefined;
    this.user.taxManagementCompanyId = undefined;
    this.user.taxManagementSystem = undefined;
    this.taxManagemantStep = 1;
    this.userService.updateUser(this.user).subscribe();
  }
}
