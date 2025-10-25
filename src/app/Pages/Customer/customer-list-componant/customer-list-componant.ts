import { Component, OnInit, OnDestroy, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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
  // State
  customers: CustomerDto[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  pageSize = 6;

  // Pagination
  pagination: PaginationInfo = {
    currentPage: 1,
    totalPages: 1,
    pageSize: 6,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false,
  };

  // Modal
  selectedCustomer: CustomerDto | null = null;
  showModal = false;
  loadingModal = false;

  // Page numbers for pagination
  pageNumbers: number[] = [];

  // Search subject for debouncing
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Optional outputs
  @Output() edit = new EventEmitter<CustomerDto>();
  @Output() view = new EventEmitter<CustomerDto>();

  constructor(private customerService: CustomerListService, private authService :AuthService) {}

  // ================= LIFECYCLE =================
  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadCustomers(true); // Reset data on initial load\
    this.checkRole();
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

  // ================= SEARCH =================
  setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((term) => {
        this.searchTerm = term;
        this.pagination.currentPage = 1;
        this.loadCustomers(true); // Reset data when searching
      });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value ?? '');
  }

  // ================= DATA LOADING =================
  async loadCustomers(resetData: boolean = false): Promise<void> {
    debugger;
    // Reset data only on initial load or search/filter changes
    if (resetData) {
      this.customers = [];
    }

    // this.loading = true;
    this.error = null;

    const skip = (this.pagination.currentPage - 1) * this.pagination.pageSize;

    try {
      const response = await this.customerService.getCustomers({
        skip,
        take: this.pagination.pageSize,
        search: this.searchTerm,
      });

      this.customers = response.items ?? [];
      this.updatePagination(response.totalCount ?? 0, skip);
    } catch (err) {
      console.error('Error loading customers:', err);
      this.error = 'Failed to load customers. Please try again.';
      this.customers = [];
    } finally {
      this.loading = false;
    }
  }

  refresh(): void {
    this.loadCustomers(true); // Reset data on refresh
  }
//check role 
checkRole() : boolean{
var res= this.authService.isAdmin();
console.log("the role is:",res)
return res;
}
  // ================= PAGINATION =================
  updatePagination(totalCount: number, skip: number): void {
    this.pagination = this.customerService.calculatePagination(
      totalCount,
      skip,
      this.pagination.pageSize
    );
    this.calculatePageNumbers();
  }
 logout() {
    this.authService.logout();
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
      this.loadCustomers(false); // Keep data visible during pagination
      this.scrollToTop();
    }
  }

  previousPage(): void {
    if (this.pagination.hasPrevious) {
      this.pagination.currentPage--;
      this.loadCustomers(false); // Keep data visible during pagination
      this.scrollToTop();
    }
  }

  nextPage(): void {
    if (this.pagination.hasNext) {
      this.pagination.currentPage++;
      this.loadCustomers(false); // Keep data visible during pagination
      this.scrollToTop();
    }
  }

  onPageSizeChange(): void {
    this.pagination.pageSize = this.pageSize;
    this.pagination.currentPage = 1;
    this.loadCustomers(true); // Reset data when changing page size
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ================= ACTIONS =================
  async viewCustomer(customer: CustomerDto): Promise<void> {
    this.showModal = true;
    // this.loadingModal = true;
    this.selectedCustomer = null;
    document.body.style.overflow = 'hidden';

    try {
      // Fetch full customer details by ID
      const fullCustomer = await this.customerService.getCustomerById(customer.id);
      this.selectedCustomer = fullCustomer;
      this.view.emit(fullCustomer);
    } catch (err) {
      console.error('Error loading customer details:', err);
      this.error = 'Failed to load customer details. Please try again.';
      this.closeModal();
    } finally {
      this.loadingModal = false;
    }
  }

  onEdit(customer: CustomerDto): void {
    this.edit.emit(customer);
    // Alternative: navigate to edit page
    // this.router.navigate(['/customers', 'edit', customer.id]);
  }

  async onDelete(customer: CustomerDto): Promise<void> {
    const confirmMessage = `Are you sure you want to delete customer "${customer.fullName}"?\n\nThis action cannot be undone.`;
    const confirmed = confirm(confirmMessage);
    
    if (!confirmed) {
      return;
    }

    // this.loading = true;
    this.error = null;

    try {
      // Call delete API
      await this.customerService.deleteCustomer(customer.id);

      // Close modal if customer was being viewed
      if (this.showModal && this.selectedCustomer?.id === customer.id) {
        this.closeModal();
      }

      // If current page becomes empty after deletion, go to previous page
      const itemsOnCurrentPage = this.customers.length;
      if (itemsOnCurrentPage === 1 && this.pagination.currentPage > 1) {
        this.pagination.currentPage--;
      }

      // Reload customers - don't reset data to show loading overlay
      await this.loadCustomers(false);
    } catch (err) {
      console.error('Delete failed:', err);
      this.error = 'Failed to delete customer. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  // ================= MODAL =================
  openCustomerModal(customer: CustomerDto): void {
    this.viewCustomer(customer);
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedCustomer = null;
    this.loadingModal = false;
    document.body.style.overflow = '';
  }

  // ================= UTILITIES =================
  formatDate(dateString: string): string {
    return this.customerService.formatDate(dateString);
  }

  formatCurrency(amount: number): string {
    return this.customerService.formatCurrency(amount);
  }

  get isEmpty(): boolean {
    return this.customers.length === 0  && !this.error;
  }

  get showPagination(): boolean {
    return this.pagination.totalPages > 1;
  }

  trackById(_: number, customer: CustomerDto): string {
    return customer.id;
  }
}