import { HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, switchMap, tap, throwError } from "rxjs";
import { AuthenticationService } from "../services/authentication.service";
import { Router } from "@angular/router";
import { AnimationsService } from "../services/animations.service";
import { MatDialog } from "@angular/material/dialog";
import { ErrorComponent } from "../modals/error/error.component";
import { PaidFeatureModalComponent } from "../modals/paid-feature-modal/paid-feature-modal.component";
import { subscriptionEnum } from "../models/enums";
import { FreeTrialEndComponent } from "../modals/free-trial-end/free-trial-end.component";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    authenticationService = inject(AuthenticationService);
    router = inject(Router);
    animationsService = inject(AnimationsService);
    dialog = inject(MatDialog);

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.authenticationService.getToken();
        const authReq = token
            ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
            : req;

        return next.handle(authReq).pipe(
            tap(event => {
                if (event instanceof HttpResponse) {
                    const newToken = event.headers.get('X-New-JWT');
                    if (newToken) {
                        this.authenticationService.setToken(newToken);
                    }

                    this.updateSubscription(event.headers);
                }
            }), catchError((err: HttpErrorResponse) => {
                this.animationsService.hideIsLoading();
                this.updateSubscription(err.headers);
                if (err.status === 401) {
                    this.authenticationService.deleteToken();
                    this.router.navigate(['/login']);
                } else if (err.status === 402) {
                    if (this.authenticationService.getSubscription() === subscriptionEnum.trial) {
                        return this.dialog.open(FreeTrialEndComponent, { disableClose: true }).afterClosed().pipe(switchMap(() => {
                            this.animationsService.changeIsloading(true);
                            const newReq = req.clone();
                            return next.handle(newReq);
                        }));
                    } else {
                        this.dialog.open(PaidFeatureModalComponent, { data: { subscription: err.error.requiredSubscription } });
                    }
                } else {
                    this.dialog.open(ErrorComponent);
                }
                return throwError(() => err);
            })
        );
    }

    updateSubscription(headers: HttpHeaders): void {
        const userSubscription = headers.get('user-subscription');
        if (userSubscription) {
            this.authenticationService.setSubscription(parseInt(userSubscription));
        }
    }
}
