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
    { title: 'פוקוס בצמיחה', subscription: subscriptionEnum.partial, text: 'עד 3 פרויקטים פעילים, ללא מנטור AI ואינטגרציות חכמות', price: 10 },
    { title: 'פוקוס על מלא', subscription: subscriptionEnum.full, text: 'ללא מגבלת פרויקטים, פיצ׳רים מתקדמים ותמיכה טכנית', price: 29 }
  ]
  currentUserSubscription: UserSubscription = this.userSubscriptions[0];

  ngAfterViewInit(): void {
    this.getUserSubscription();
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

  getUserSubscription() {
    const subscription = this.authenticationService.getSubscription();
    this.currentUserSubscription = this.userSubscriptions.find(sub => sub.subscription === subscription) || this.userSubscriptions[0];
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
    this.httpService.updateUser(this.user).subscribe(res => { });
  }

  navigateToSubscription() {
    window.location.href = environment.subscriptionUrl;
  }

  unSubscribe() {
    // this.fullName = this.user.firstName + ' ' + this.user.lastName;
    // const message = `הי, זה ${this.fullName}.%0A כתובת המייל שלי היא ${this.user.email}.%0A אני משתמש בפוקוס ורוצה לבטל את המנוי שלי`;
    // const url = `https://wa.me/${this.arielsNumber}?text=${message}`;
    window.open(environment.subscriptionUrl, '_blank');
  }

  logOut() {
    this.authenticationService.logOut();
    this.dialogRef.close();
  }
}
