import { Routes } from '@angular/router';
import { LoginComponant } from './Pages/Account/login-componant/login-componant';
import { CustomerComponent } from './Pages/Customer/customer-componant/customer-componant';

export const routes: Routes = [
   { path: '', redirectTo: 'Customer', pathMatch: 'full' },
  { path: 'login', component: LoginComponant },
   { path: 'Customer', component: CustomerComponent },

];
