import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../Services/AuthService';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[]; // Allowed roles: 'admin', 'user', or empty for all
}

@Component({
  selector: 'app-navbar-component',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar-component.html',
  styleUrls: ['./navbar-component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  currentRoute = '';
  isAuthenticated = false;
  currentUserRole: string | null = null;
  
  private destroy$ = new Subject<void>();

  navItems: NavItem[] = [
    {
      label: 'Home',
      path: '/',
      icon: '🏠',
      roles: [] // Available to all
    },
    {
      label: 'Customers',
      path: '/Customer-list',
      icon: '👥',
      roles: ['admin', 'user'] // Available to both admin and user
    },
    {
      label: 'Add Customer',
      path: '/Customer',
      icon: '➕',
      roles: ['admin'] // Only admin can create
    }
  ];

  authItems: NavItem[] = [
    {
      label: 'Login',
      path: '/login',
      icon: '🔐',
      roles: []
    },
    {
      label: 'Sign Up',
      path: '/signup',
      icon: '📝',
      roles: []
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Initialize auth state
    this.updateAuthState();

    // Track current route
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        this.isMenuOpen = false;
        this.updateAuthState(); // Update auth state on route change
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateAuthState(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.currentUserRole = this.authService.getCurrentRole();
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
    this.authService.logout();
    this.updateAuthState();
    this.router.navigate(['/login']);
  }

  /**
   * Check if current user has permission to see this nav item
   */
  canAccessItem(item: NavItem): boolean {
    // If no roles specified, item is available to all
    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    // If not authenticated and item requires roles, hide it
    if (!this.isAuthenticated) {
      return false;
    }

    // Check if user's role is in the allowed roles list
    const userRole = this.currentUserRole?.toLowerCase();
    return item.roles.some(role => role.toLowerCase() === userRole);
  }

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => {
      // Only show nav items if authenticated
      if (!this.isAuthenticated) {
        return false;
      }
      
      return this.canAccessItem(item);
    });
  }

  get visibleAuthItems(): NavItem[] {
    // Only show login/signup when not authenticated
    return this.isAuthenticated ? [] : this.authItems;
  }

  get userDisplayName(): string {
     return this.authService.UserName()
    
    
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isUser(): boolean {
    return this.authService.isUser();
  }
}