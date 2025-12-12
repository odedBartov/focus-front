import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { map, Observable } from "rxjs";
import { UpdateStepsResponse } from "../models/UpdateStepsResponse";
import { BonusForActivityComponent } from "../modals/bonus-for-activity/bonus-for-activity.component";

@Injectable()
export class UpdateStepsInterceptor implements HttpInterceptor {
    dialog = inject(MatDialog);
    private readonly UPDATE_STEPS_URL = '/api/Steps/updateSteps';

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.url.includes(this.UPDATE_STEPS_URL)) {
            return next.handle(req).pipe(
                map((event: HttpEvent<any>) => {
                    if (event instanceof HttpResponse) {
                        const originalBody = event.body as UpdateStepsResponse;                        
                        if (!originalBody.steps) {
                            return event;
                        }

                        const newBody = originalBody.steps;
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