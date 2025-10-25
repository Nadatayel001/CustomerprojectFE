import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, filter } from 'rxjs';
import { CustomerDto, PaginationInfo } from '../../../proxy/CustomerList/CustomerList.model';
import { CustomerListService } from '../../../proxy/CustomerList/CustomerList.service';
import { AuthService } from '../../../Services/AuthService';

@Component({
  selector: 'app-customer-list-componant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-list-componant.html',
  styleUrls: ['./customer-list-componant.css'],
})
export class CustomerListComponant implements OnInit, OnDestroy {
  customers: CustomerDto[] = [];
  error: string | null = null;
  searchTerm = '';
  pageSize = 6;

  pagination: PaginationInfo = {
    currentPage: 1,
    totalPages: 1,
    pageSize: 6,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false,
  };

  selectedCustomer: CustomerDto | null = null;
  showModal = false;

  pageNumbers: number[] = [];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private customerService: CustomerListService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.setupRouterListener();
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.showModal) {
      this.closeModal();
    }
  }

  setupRouterListener(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadCustomers();
      });
  }

  setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((term) => {
        this.searchTerm = term;
        this.pagination.currentPage = 1;
        this.loadCustomers();
      });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value ?? '');
  }

  loadCustomers(): void {
    this.error = null;
    const skip = (this.pagination.currentPage - 1) * this.pagination.pageSize;

    this.customerService.getCustomers({
      skip,
      take: this.pagination.pageSize,
      search: this.searchTerm,
    }).then(response => {
      this.customers = response.items || [];
      this.updatePagination(response.totalCount ?? 0, skip);
    }).catch(() => {
      this.error = 'Failed to load customers. Please try again.';
      this.customers = [];
      this.pagination = {
        currentPage: 1,
        totalPages: 1,
        pageSize: this.pageSize,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false,
      };
    });
  }

  refresh(): void {
    this.searchTerm = '';
    this.pagination.currentPage = 1;
    this.loadCustomers();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  downloadPdf(): void {
    this.customerService.exportToPdf().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Customers_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.error = 'Failed to export PDF. Please try again.';
      }
    });
  }

  updatePagination(totalCount: number, skip: number): void {
    this.pagination = this.customerService.calculatePagination(
      totalCount,
      skip,
      this.pagination.pageSize
    );
    this.calculatePageNumbers();
  }

  calculatePageNumbers(): void {
    const maxPages = 5;
    this.pageNumbers = [];

    if (this.pagination.totalPages <= maxPages) {
      for (let i = 1; i <= this.pagination.totalPages; i++) {
        this.pageNumbers.push(i);
      }
      return;
    }

    if (this.pagination.currentPage <= 3) {
      for (let i = 1; i <= maxPages; i++) {
        this.pageNumbers.push(i);
      }
      return;
    }

    if (this.pagination.currentPage >= this.pagination.totalPages - 2) {
      for (let i = this.pagination.totalPages - maxPages + 1; i <= this.pagination.totalPages; i++) {
        this.pageNumbers.push(i);
      }
      return;
    }

    for (let i = this.pagination.currentPage - 2; i <= this.pagination.currentPage + 2; i++) {
      this.pageNumbers.push(i);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages && page !== this.pagination.currentPage) {
      this.pagination.currentPage = page;
      this.loadCustomers();
      this.scrollToTop();
    }
  }

  previousPage(): void {
    if (this.pagination.hasPrevious) {
      this.pagination.currentPage--;
      this.loadCustomers();
      this.scrollToTop();
    }
  }

  nextPage(): void {
    if (this.pagination.hasNext) {
      this.pagination.currentPage++;
      this.loadCustomers();
      this.scrollToTop();
    }
  }

  onPageSizeChange(): void {
    this.pagination.pageSize = this.pageSize;
    this.pagination.currentPage = 1;
    this.loadCustomers();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewCustomer(customer: CustomerDto): void {
    this.showModal = true;
    this.selectedCustomer = null;
    document.body.style.overflow = 'hidden';

    this.customerService.getCustomerById(customer.id)
      .then(fullCustomer => {
        this.selectedCustomer = fullCustomer;
      })
      .catch(() => {
        this.error = 'Failed to load customer details. Please try again.';
        this.closeModal();
      });
  }

  onEdit(customer: CustomerDto): void {
    if (this.showModal) {
      this.closeModal();
    }
    this.router.navigate(['/Customer', customer.id]);
  }

  onDelete(customer: CustomerDto): void {
    const confirmMessage = `Are you sure you want to delete customer "${customer.fullName}"?\n\nThis action cannot be undone.`;
    const confirmed = confirm(confirmMessage);
    
    if (!confirmed) {
      return;
    }

    this.error = null;

    this.customerService.deleteCustomer(customer.id)
      .then(() => {
        if (this.showModal && this.selectedCustomer?.id === customer.id) {
          this.closeModal();
        }

        const itemsOnCurrentPage = this.customers.length;
        if (itemsOnCurrentPage === 1 && this.pagination.currentPage > 1) {
          this.pagination.currentPage--;
        }

        this.loadCustomers();
      })
      .catch(() => {
        this.error = 'Failed to delete customer. Please try again.';
      });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedCustomer = null;
    document.body.style.overflow = '';
  }

  formatDate(dateString: string): string {
    return this.customerService.formatDate(dateString);
  }

  formatCurrency(amount: number): string {
    return this.customerService.formatCurrency(amount);
  }

  get isEmpty(): boolean {
    return this.customers.length === 0 && !this.error;
  }

  get showPagination(): boolean {
    return this.pagination.totalPages > 1;
  }

  trackById(_: number, customer: CustomerDto): string {
    return customer.id;
  }
}