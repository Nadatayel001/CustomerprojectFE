import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CustomerDto,
  CustomerListResponse,
  CustomerQueryParams,
  PaginationInfo
} from './CustomerList.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerListService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = `${environment.apiBaseUrl}/Customer`;
  }

  /**
   * Fetch customers with pagination and search
   */
  getCustomers(params: CustomerQueryParams = {}): Promise<CustomerListResponse> {
    const { skip = 0, take = 6, search = '' } = params;

    let httpParams = new HttpParams()
      .set('skip', skip.toString())
      .set('take', take.toString());

    if (search?.trim()) {
      httpParams = httpParams.set('search', search.trim());
    }

    return this.http
      .get<CustomerListResponse>(this.baseUrl, { params: httpParams })
      .pipe(catchError(this.handleError))
      .toPromise()
      .then(response => response as CustomerListResponse);
  }

  /**
   * Get a single customer by ID
   */
  getCustomerById(id: string): Promise<CustomerDto> {
    if (!id) {
      return Promise.reject(new Error('Customer ID is required'));
    }

    return this.http
      .get<CustomerDto>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError))
      .toPromise()
      .then(response => response as CustomerDto);
  }
 exportToPdf() {
  return this.http.get(`${this.baseUrl}/export`, { responseType: 'blob' });
}

  /**
   * Delete a customer by ID
   */
  deleteCustomer(id: string): Promise<void> {
    if (!id) {
      return Promise.reject(new Error('Customer ID is required'));
    }

    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError))
      .toPromise()
      .then(() => undefined);
  }

  /**
   * Calculate pagination information
   */
  calculatePagination(
    totalCount: number,
    skip: number,
    take: number
  ): PaginationInfo {
    const currentPage = Math.floor(skip / take) + 1;
    const totalPages = Math.max(1, Math.ceil(totalCount / take));

    return {
      currentPage,
      totalPages,
      pageSize: take,
      totalCount,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    };
  }

  /**
   * Format date to readable string
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) {
      return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      
      // Add more specific error messages based on status code
      if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.status === 500) {
        errorMessage = 'Server error occurred. Please try again later';
      }
    }

    console.error('HTTP Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}