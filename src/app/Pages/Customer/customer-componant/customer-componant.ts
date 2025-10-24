import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Customer } from '../../../proxy/Customer/Customer.model';
import { LookupItem } from '../../../proxy/Lookup/Lookup.model';
import { Subject, takeUntil } from 'rxjs';
import { CustomerService } from '../../../proxy/Customer/Customer.service';
import { LookupService } from '../../../proxy/Lookup/Lookup.service';


@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit, OnDestroy {
  @Input() customerId: string | null = null;
  @Output() success = new EventEmitter<Customer>();
  @Output() cancel = new EventEmitter<void>();

  // Form
  customerForm!: FormGroup;

  // Dropdowns
  genders: LookupItem[] = [];
  governorates: LookupItem[] = [];
  districts: LookupItem[] = [];
  villages: LookupItem[] = [];

  // UI State
  loading = false;
  submitting = false;
  isEditMode = false;
  generalError: string | null = null;

  // Unsubscribe
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private lookupService: LookupService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
    this.setupFormListeners();

    if (this.customerId) {
      this.isEditMode = true;
      this.loadCustomerData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize reactive form
   */
  private initializeForm(): void {
    this.customerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      nationalID: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
      genderId: ['', Validators.required],
      governorateId: ['', Validators.required],
      districtId: ['', Validators.required],
      villageId: ['', Validators.required],
      birthDate: ['', Validators.required],
      salary: [0, [Validators.required, Validators.min(0)]]
    });
  }

 
  private setupFormListeners(): void {
    this.customerForm.get('governorateId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(governorateId => {
        this.onGovernorateChange(governorateId);
      });

    this.customerForm.get('districtId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(districtId => {
        this.onDistrictChange(districtId);
      });
  }


  private async loadInitialData(): Promise<void> {
    this.loading = true;
    try {
      // Services return Promise directly, no need for toPromise()
      const [genders, governorates] = await Promise.all([
        this.lookupService.getGenders(),
        this.lookupService.getGovernorates()
      ]);

      this.genders = genders || [];
      this.governorates = governorates || [];
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.generalError = 'Failed to load form data';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load customer data for editing
   */
  private async loadCustomerData(): Promise<void> {
    if (!this.customerId) return;

    this.loading = true;
    try {
      // Service returns Promise directly, no need for toPromise()
      const customer = await this.customerService.getCustomerById(this.customerId);

      if (customer) {
        // Load dependent dropdowns first
        if (customer.governorateId) {
          this.districts = await this.lookupService
            .getDistrictsByGovernorate(customer.governorateId) || [];
        }

        if (customer.districtId) {
          this.villages = await this.lookupService
            .getVillagesByDistrict(customer.districtId) || [];
        }

        // Patch form with customer data
        this.customerForm.patchValue({
          fullName: customer.fullName,
          nationalID: customer.nationalID,
          genderId: customer.genderId,
          governorateId: customer.governorateId,
          districtId: customer.districtId,
          villageId: customer.villageId,
          birthDate: this.formatDateForInput(customer.birthDate),
          salary: customer.salary
        });
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
      this.generalError = 'Failed to load customer data';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Handle governorate change
   */
  private async onGovernorateChange(governorateId: string): Promise<void> {
    // Reset dependent fields
    this.customerForm.patchValue({
      districtId: '',
      villageId: ''
    });

    this.districts = [];
    this.villages = [];

    if (governorateId) {
      try {
        // Service returns Promise directly, no need for toPromise()
        this.districts = await this.lookupService
          .getDistrictsByGovernorate(governorateId) || [];
      } catch (error) {
        console.error('Error loading districts:', error);
      }
    }
  }

  /**
   * Handle district change
   */
  private async onDistrictChange(districtId: string): Promise<void> {
    // Reset dependent field
    this.customerForm.patchValue({
      villageId: ''
    });

    this.villages = [];

    if (districtId) {
      try {
        // Service returns Promise directly, no need for toPromise()
        this.villages = await this.lookupService
          .getVillagesByDistrict(districtId) || [];
      } catch (error) {
        console.error('Error loading villages:', error);
      }
    }
  }

  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.customerForm);

    if (this.customerForm.invalid) {
      return;
    }

    this.submitting = true;
    this.generalError = null;

    try {
      const formValue = this.customerForm.value;

      // Prepare payload
      const payload = {
        fullName: formValue.fullName,
        nationalID: formValue.nationalID,
        genderId: formValue.genderId,
        governorateId: formValue.governorateId,
        districtId: formValue.districtId,
        villageId: formValue.villageId,
        birthDate: new Date(formValue.birthDate).toISOString(),
        salary: formValue.salary
      };

      let result: Customer | undefined;

      if (this.isEditMode && this.customerId) {
        // Update existing customer
        const updatePayload = {
          ...payload,
          id: this.customerId
        };
        // Service returns Promise directly, no need for toPromise()
        result = await this.customerService.updateCustomer(this.customerId, updatePayload);
      } else {
        // Create new customer
        // Service returns Promise directly, no need for toPromise()
        result = await this.customerService.createCustomer(payload);
      }

      if (result) {
        this.success.emit(result);

        // Reset form if creating
        if (!this.isEditMode) {
          this.customerForm.reset();
          this.districts = [];
          this.villages = [];
        }
      }
    } catch (error: any) {
      console.error('Error saving customer:', error);
      this.generalError = error.message || 'Failed to save customer';
    } finally {
      this.submitting = false;
    }
  }

  /**
   * Handle cancel
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Format date for input field
   */
  private formatDateForInput(date: string): string {
    if (!date) return '';
    return date.split('T')[0];
  }

  /**
   * Get form control
   */
  getControl(controlName: string): AbstractControl | null {
    return this.customerForm.get(controlName);
  }

  /**
   * Check if field has error
   */
  hasError(controlName: string, errorType: string): boolean {
    const control = this.getControl(controlName);
    return !!(control?.hasError(errorType) && control?.touched);
  }

  /**
   * Get error message for field
   */
  getErrorMessage(controlName: string): string {
    const control = this.getControl(controlName);

    if (!control?.touched || !control?.errors) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      return this.getFieldLabel(controlName) + ' is required';
    }

    if (errors['minlength']) {
      return this.getFieldLabel(controlName) + ' must be at least ' + 
             errors['minlength'].requiredLength + ' characters';
    }

    if (errors['pattern']) {
      if (controlName === 'nationalID') {
        return 'National ID must be exactly 14 digits';
      }
    }

    if (errors['min']) {
      return this.getFieldLabel(controlName) + ' must be at least ' + errors['min'].min;
    }

    return 'Invalid ' + this.getFieldLabel(controlName).toLowerCase();
  }

  /**
   * Get field label
   */
  private getFieldLabel(controlName: string): string {
    const labels: { [key: string]: string } = {
      fullName: 'Full Name',
      nationalID: 'National ID',
      genderId: 'Gender',
      governorateId: 'Governorate',
      districtId: 'District',
      villageId: 'Village',
      birthDate: 'Birth Date',
      salary: 'Salary'
    };

    return labels[controlName] || controlName;
  }

  /**
   * Check if district dropdown should be disabled
   */
  isDistrictDisabled(): boolean {
    return !this.customerForm.get('governorateId')?.value || this.districts.length === 0;
  }

  /**
   * Check if village dropdown should be disabled
   */
  isVillageDisabled(): boolean {
    return !this.customerForm.get('districtId')?.value || this.villages.length === 0;
  }
}