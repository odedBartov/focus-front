import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, tap, throwError } from "rxjs";
import { AuthenticationService } from "../services/authentication.service";
import { Router } from "@angular/router";
import { AnimationsService } from "../services/animations.service";
import { MatDialog } from "@angular/material/dialog";
import { ErrorComponent } from "../modals/error/error.component";
import { environment } from "../../environments/environment";
import { PaidFeatureModalComponent } from "../modals/paid-feature-modal/paid-feature-modal.component";

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
                }
            }), catchError((err: HttpErrorResponse) => {
                this.animationsService.hideIsLoading();
                if (err.status === 401) {
                    this.authenticationService.deleteToken();
                    this.router.navigate(['/login']);
                } else if (err.status === 402) {
                    this.dialog.open(PaidFeatureModalComponent, { data: { subscription: err.error.requiredSubscription } });
                } else {
                    this.dialog.open(ErrorComponent);
                }
                return throwError(() => err);
            })
        );
    }
}
