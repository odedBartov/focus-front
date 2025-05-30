import { provideRouter, RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { ProjectPageComponent } from './components/project-page/project-page.component';
import { bootstrapApplication } from '@angular/platform-browser';
import { HomeComponent } from './components/home/home.component';
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
    { path: "", redirectTo: "home", pathMatch: 'full' },
    { path: "login", component: AuthenticationComponent},
    { path: "home", component: HomeComponent },
    { path: "profile", component: ProfileComponent },
    { path: "project/:projectId/:readOnly", component: ProjectPageComponent }
];
