import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Project } from '../models/project';
import { UserProjects } from '../models/userProjects';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor() { }

  getProjects (): Observable<UserProjects> {
    const p1 = new Project();
    p1.name = 'פרויקט ראשון';
    p1.description = 'פה יש הסבר על הפרויקט';
    p1.progress = 17;

    const p2 = new Project();
    p2.name = 'פרויקט שני';
    p2.description = 'סתם טקסט של תיאור';
    p2.progress = 80

    const p3 = new Project();
    p3.name = 'פרויקט שלישי';
    p3.description = 'זה פרויקט מוקפא';

    const p4 = new Project();
    p4.name = 'פרויקט רביעי';
    p4.description = 'זה סתם עוד פרויקט שהסתיים';
    p4.progress = 100;

    const result = new UserProjects();
    result.activeProjects = [p1, p2];
    result.frozenProjects = [p3];
    result.finishedProjects = [p4];

    return of(result);
  }
}
