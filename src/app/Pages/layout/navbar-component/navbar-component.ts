import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter } from "rxjs";

interface NavItem {
  label: string;
  path: string;
  icon: string;
  requiresAuth?: boolean;
}

@Component({
  selector: 'app-navbar-component',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.css',
})


export class NavbarComponent implements OnInit{
 isMenuOpen = false;
  currentRoute = '';
  isAuthenticated = false; // TODO: Connect to your auth service

  navItems: NavItem[] = [
    {
      label: 'Home',
      path: '/',
      icon: '🏠',
      requiresAuth: false
    },
    {
      label: 'Customers',
      path: '/customer-list',
      icon: '👥',
      requiresAuth: false
    },
    {
      label: 'Add Customer',
      path: '/customer',
      icon: '➕',
      requiresAuth: false
    }
  ];

  authItems: NavItem[] = [
    {
      label: 'Login',
      path: '/login',
      icon: '🔐',
      requiresAuth: false
    },
    {
      label: 'Sign Up',
      path: '/signup',
      icon: '📝',
      requiresAuth: false
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    debugger
    // Track current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        this.isMenuOpen = false; // Close menu on navigation
      });

    // TODO: Subscribe to auth state changes
    // this.authService.isAuthenticated$.subscribe(
    //   isAuth => this.isAuthenticated = isAuth
    // );
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  isActive(path: string): boolean {
    if (path === '/') {
      return this.currentRoute === path;
    }
    return this.currentRoute.startsWith(path);
  }

  logout(): void {
    // TODO: Implement logout logic
    // this.authService.logout();
    this.router.navigate(['/login']);
  }

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => 
      !item.requiresAuth || this.isAuthenticated
    );
  }

  get visibleAuthItems(): NavItem[] {
    return this.isAuthenticated ? [] : this.authItems;
  }
}