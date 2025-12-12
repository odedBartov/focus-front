import { Component, inject, OnInit } from '@angular/core';
import { GoogleSigninComponent } from '../google-signin/google-signin.component';
import { HttpService } from '../../services/http.service';
import { Router } from '@angular/router';
import { AnimationsService } from '../../services/animations.service';
import { AuthenticationService } from '../../services/authentication.service';
import { MatDialog } from '@angular/material/dialog';
import { NewUserComponent } from '../../modals/new-user/new-user.component';
import { FreeTrialStartComponent } from '../../modals/free-trial-start/free-trial-start.component';
import { isUsingDesktop } from '../../helpers/functions';

@Component({
  selector: 'app-authentication',
  imports: [GoogleSigninComponent],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss'
})
export class AuthenticationComponent {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  router = inject(Router);
  authenticationService = inject(AuthenticationService);
  dialog = inject(MatDialog);

  userSignedIn(jwt: string) {
    this.animationsService.changeIsloading(true);
    this.httpService.loginWithGoogleToken(jwt).subscribe(
      res => {
        this.animationsService.changeIsloading(false);
        if (this.authenticationService.getIsNewUser()) {
          const dialogParams = isUsingDesktop()? {data: { user: res.body } } : {width: '100%', height: '100%', data: { user: res.body } };
          const dialogRef = this.dialog.open(NewUserComponent, dialogParams);
          dialogRef.afterClosed().subscribe(res => {
            if (res) {
              this.animationsService.changeIsloading(true);
              this.httpService.updateUser(res).subscribe(newUser => {
                this.animationsService.changeIsloading(false);
                this.authenticationService.setUserName(newUser.firstName, newUser.lastName);
                if (this.authenticationService.getIsNewUser()) {
                  this.authenticationService.setNewUser(false);
                  this.dialog.open(FreeTrialStartComponent).afterClosed().subscribe(() => {
                    this.router.navigate(['/home']);
                  });
                } else {
                  this.router.navigate(['/home']);
                }
              })
            }
          })
        } else {
          this.router.navigate(['/home']);
        }
      }
    );
  }
}
