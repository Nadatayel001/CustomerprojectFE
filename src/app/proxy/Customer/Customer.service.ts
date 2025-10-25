import { environment } from '../../environments/environment';
import { 
  Customer, 
  CustomerCreateRequest, 
  CustomerUpdateRequest 
} from './Customer.model';


export class CustomerService {
  private readonly API_BASE_URL: string;

  constructor() {
    this.API_BASE_URL = environment.apiBaseUrl;
  }

  async getCustomerById(id: string): Promise<Customer> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/Customer/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customer: ${response.statusText}`);
      }

      const customer: Customer = await response.json();
      return customer;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }


  async getAllCustomers(): Promise<Customer[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/Customer`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }

      const customers: Customer[] = await response.json();
      return customers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }


  async createCustomer(customerData: CustomerCreateRequest): Promise<Customer> {
    try {
      debugger
      const response = await fetch(`${this.API_BASE_URL}/customer/createOrUpdate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create customer: ${response.statusText}`);
      }

      const customer: Customer = await response.json();
      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }


  async updateCustomer(id: string, customerData: CustomerUpdateRequest): Promise<Customer> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/customer/createOrUpdate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update customer: ${response.statusText}`);
      }

      const customer: Customer = await response.json();
      return customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }


  async deleteCustomer(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/Customer/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete customer: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }


  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/Customer/search?q=${encodeURIComponent(searchTerm)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search customers: ${response.statusText}`);
      }

      const customers: Customer[] = await response.json();
      return customers;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

 
  getApiBaseUrl(): string {
    return this.API_BASE_URL;
  }


  isProduction(): boolean {
    return environment.production;
  }
}

export const customerService = new CustomerService();