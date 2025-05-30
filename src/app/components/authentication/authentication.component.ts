import { Component, inject, OnInit } from '@angular/core';
import { GoogleSigninComponent } from '../google-signin/google-signin.component';
import { HttpService } from '../../services/http.service';
import { Router } from '@angular/router';
import { LoadingService } from '../../services/loading.service';
import { AuthenticationService } from '../../services/authentication.service';
import { MatDialog } from '@angular/material/dialog';
import { NewUserComponent } from '../../modals/new-user/new-user.component';

@Component({
  selector: 'app-authentication',
  imports: [GoogleSigninComponent],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss'
})
export class AuthenticationComponent {
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  router = inject(Router);
  authenticationService = inject(AuthenticationService);
  dialog = inject(MatDialog);

  userSignedIn(jwt: string) {
    this.loadingService.changeIsloading(true);
    this.httpService.loginWithGoogleToken(jwt).subscribe(
      res => {
        this.loadingService.changeIsloading(false);
        if (this.authenticationService.getIsNewUser()) {
          const dialogRef = this.dialog.open(NewUserComponent);
          dialogRef.afterClosed().subscribe(res => {
            if (res) {
              this.loadingService.changeIsloading(true);
              this.httpService.updateUser(res).subscribe(newUser => {
                this.loadingService.changeIsloading(false);
                this.authenticationService.setNewUser(false);
                this.authenticationService.setUserName(newUser.firstName, newUser.lastName);
                this.router.navigate(['/home']);
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
