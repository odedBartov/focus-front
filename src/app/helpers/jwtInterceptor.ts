import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { AuthenticationService } from "../services/authentication.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    authenticationService = inject(AuthenticationService);
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
            })
        );
    }
}
