import { provideRouter, RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { ProjectPageComponent } from './project-page/project-page.component';
import { bootstrapApplication } from '@angular/platform-browser';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    { path: "", redirectTo: "home", pathMatch: 'full' },
    { path: "home", component: HomeComponent },
    { path: "project/:projectId", component: ProjectPageComponent }
];

bootstrapApplication(AppComponent, {
    providers: [provideRouter(routes)],
});
