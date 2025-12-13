import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { map, Observable } from "rxjs";
import { CrateStepResponse } from "../models/CreateStepResponse";
import { BonusForActivityComponent } from "../modals/bonus-for-activity/bonus-for-activity.component";

@Injectable()
export class CreateStepInterceptor implements HttpInterceptor {
    dialog = inject(MatDialog);
    private readonly UPDATE_STEPS_URL = '/api/Steps/createStep';

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.url.includes(this.UPDATE_STEPS_URL)) {
            return next.handle(req).pipe(
                map((event: HttpEvent<any>) => {
                    if (event instanceof HttpResponse) {
                        const originalBody = event.body as CrateStepResponse;                        
                        if (!originalBody.step) {
                            return event;
                        }

                        const newBody = originalBody.step;
                        const modifiedResponse = event.clone({
                            body: newBody
                        });

                        if (originalBody.gotExtraDays) {
                            this.dialog.open(BonusForActivityComponent);
                        }

                        return modifiedResponse;
                    }
                    return event;
                })
            );
        }

        // For all other requests, pass the original request through
        return next.handle(req);
    }
}