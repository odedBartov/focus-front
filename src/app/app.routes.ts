import { Routes } from '@angular/router';
import { ProjectPageComponent } from './components/project-page/project-page.component';
import { HomeComponent } from './components/home/home.component';
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { UnsupportedDeviceComponent } from './components/unsupported-device/unsupported-device.component';

export const routes: Routes = [
    { path: "", redirectTo: "home", pathMatch: 'full' },
    { path: "login", component: AuthenticationComponent},
    { path: "home", component: HomeComponent },
    { path: "project/:projectId/:readOnly", component: ProjectPageComponent },
    { path: "unsupportedDevice", component: UnsupportedDeviceComponent}
];
