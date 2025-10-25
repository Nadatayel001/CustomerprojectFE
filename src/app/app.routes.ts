import { Routes } from '@angular/router';
import { LoginComponant } from './Pages/Account/login-componant/login-componant';
import { CustomerComponent } from './Pages/Customer/customer-componant/customer-componant';
import { CustomerListComponant } from './Pages/Customer/customer-list-componant/customer-list-componant';
import { SignupComponent } from './Pages/Account/signup-componant/signup-componant';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponant },
  { path: 'Customer', component: CustomerComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'Customer/:id', component: CustomerComponent },
    { path: 'Customer-list', component: CustomerListComponant },


];
