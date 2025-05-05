import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, tap, throwError } from "rxjs";
import { AuthenticationService } from "../services/authentication.service";
import { Router } from "@angular/router";
import { LoadingService } from "../services/loading.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    authenticationService = inject(AuthenticationService);
    router = inject(Router);
    loadingService = inject(LoadingService);

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
                this.loadingService.hideIsLoading();
                if (err.status === 401) {
                    this.authenticationService.deleteToken();
                    this.router.navigate(['/login']);
                } else {
                    alert(err.message); // show in toaster
                }
                return throwError(() => err);
            })
        );
    }
}
