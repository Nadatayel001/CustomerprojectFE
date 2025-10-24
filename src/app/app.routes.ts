import { Routes } from '@angular/router';
import { LoginComponant } from './Pages/Account/login-componant/login-componant';

export const routes: Routes = [
   { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponant },
];
