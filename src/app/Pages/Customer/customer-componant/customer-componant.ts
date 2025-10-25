import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer } from '../../../proxy/Customer/Customer.model';
import { LookupItem } from '../../../proxy/Lookup/Lookup.model';
import { Subject, takeUntil } from 'rxjs';
import { CustomerService } from '../../../proxy/Customer/Customer.service';
import { LookupService } from '../../../proxy/Lookup/Lookup.service';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [CustomerService, LookupService],
  templateUrl: './customer-componant.html',
  styleUrls: ['./customer-componant.css']
})
export class CustomerComponent implements OnInit, OnDestroy {
  customerId: string | null = null;
  customerForm!: FormGroup;
  genders: LookupItem[] = [];
  governorates: LookupItem[] = [];
  districts: LookupItem[] = [];
  villages: LookupItem[] = [];
  loading = false;
  submitting = false;
  isEditMode = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private lookupService: LookupService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.customerId = params['id'] || null;
      this.isEditMode = !!this.customerId;
      this.initializeForm();
      this.setupFormListeners();
      this.loadInitialData();
      if (this.customerId) {
        this.loadCustomerData();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.customerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      nationalID: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
      genderId: ['', Validators.required],
      governorateId: ['', Validators.required],
      districtId: [{ value: '', disabled: true }, Validators.required],
      villageId: [{ value: '', disabled: true }, Validators.required],
      birthDate: ['', Validators.required],
      salary: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private setupFormListeners(): void {
    this.customerForm.get('governorateId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(governorateId => this.onGovernorateChange(governorateId));

    this.customerForm.get('districtId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(districtId => this.onDistrictChange(districtId));
  }

  private async loadInitialData(): Promise<void> {
    this.clearMessages();
    try {
      const [genders, governorates] = await Promise.all([
        this.lookupService.getGenders(),
        this.lookupService.getGovernorates()
      ]);
      this.genders = genders || [];
      this.governorates = governorates || [];
    } catch (error) {
      this.showError('Failed to load form data. Please refresh the page.');
    } finally {
      this.loading = false;
    }
  }

  private async loadCustomerData(): Promise<void> {
    if (!this.customerId) return;
    this.clearMessages();
    try {
      const customer = await this.customerService.getCustomerById(this.customerId);
      if (!customer) {
        this.showError('Customer not found');
        return;
      }
      await this.loadDependentData(customer);
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
    } catch (error) {
      this.showError('Failed to load customer data. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  private async loadDependentData(customer: Customer): Promise<void> {
    if (customer.governorateId) {
      this.districts = await this.lookupService.getDistrictsByGovernorate(customer.governorateId) || [];
      if (this.districts.length > 0) this.customerForm.get('districtId')?.enable();
    }
    if (customer.districtId) {
      this.villages = await this.lookupService.getVillagesByDistrict(customer.districtId) || [];
      if (this.villages.length > 0) this.customerForm.get('villageId')?.enable();
    }
  }

  private async onGovernorateChange(governorateId: string): Promise<void> {
    const districtControl = this.customerForm.get('districtId');
    const villageControl = this.customerForm.get('villageId');
    districtControl?.disable(); districtControl?.setValue('');
    villageControl?.disable(); villageControl?.setValue('');
    this.districts = []; this.villages = [];
    if (!governorateId) return;
    try {
      this.districts = await this.lookupService.getDistrictsByGovernorate(governorateId) || [];
      if (this.districts.length > 0) districtControl?.enable();
    } catch {
      this.showError('Failed to load districts');
    }
  }

  private async onDistrictChange(districtId: string): Promise<void> {
    const villageControl = this.customerForm.get('villageId');
    villageControl?.disable(); villageControl?.setValue('');
    this.villages = [];
    if (!districtId) return;
    try {
      this.villages = await this.lookupService.getVillagesByDistrict(districtId) || [];
      if (this.villages.length > 0) villageControl?.enable();
    } catch {
      this.showError('Failed to load villages');
    }
  }

  async onSubmit(): Promise<void> {
    this.markFormGroupTouched(this.customerForm);
    if (this.customerForm.invalid) {
      this.showError('Please fill in all required fields correctly');
      return;
    }
    this.clearMessages();
    this.submitting = true;
    try {
      const formValue = this.customerForm.getRawValue();
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
      if (this.isEditMode && this.customerId) {
        await this.updateCustomer(payload);
      } else {
        await this.createCustomer(payload);
      }
    } catch (error: any) {
      this.showError(error?.message || 'Failed to save customer. Please try again.');
    } finally {
      this.submitting = false;
    }
  }

  private async createCustomer(payload: any): Promise<void> {
  try {
    const result = await this.customerService.createCustomer(payload);
    if (result) {
      this.showSuccess('Customer created successfully!');
      setTimeout(() => this.router.navigate(['/Customer-list']), 1500);
    }
  } catch (error: any) {
     alert(error?.message || 'An error occurred');
    const errMsg = error?.error?.message || 'Failed to create customer.';
    this.showError(errMsg);
  }
}

private async updateCustomer(payload: any): Promise<void> {
  if (!this.customerId) return;
  try {
    const updatePayload = { ...payload, id: this.customerId };
    const result = await this.customerService.updateCustomer(this.customerId, updatePayload);
    if (result) {
      this.showSuccess('Customer updated successfully!');
      setTimeout(() => this.router.navigate(['/ustomer-list']), 1500);
    }
  } catch (error: any) {
    const errMsg = error?.error?.message || 'Failed to update customer.';
    this.showError(errMsg);
  }
}

  onCancel(): void {
    this.router.navigate(['/customer-list']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
    });
  }

  getControl(controlName: string): AbstractControl | null {
    return this.customerForm.get(controlName);
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.getControl(controlName);
    return !!(control?.hasError(errorType) && control?.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.getControl(controlName);
    if (!control?.touched || !control?.errors) return '';
    const errors = control.errors;
    if (errors['required']) return `${this.getFieldLabel(controlName)} is required`;
    if (errors['minlength']) return `${this.getFieldLabel(controlName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['pattern'] && controlName === 'nationalID') return 'National ID must be exactly 14 digits';
    if (errors['min']) return `${this.getFieldLabel(controlName)} must be at least ${errors['min'].min}`;
    return `Invalid ${this.getFieldLabel(controlName).toLowerCase()}`;
  }

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

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = null;
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;
    setTimeout(() => { this.errorMessage = null; }, 5000);
  }

  private clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }

  private formatDateForInput(date: string): string {
    if (!date) return '';
    return date.split('T')[0];
  }
}
