import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../Services/AuthService';

@Component({
  selector: 'app-signup-componant',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './signup-componant.html',
  styleUrls: ['./signup-componant.css']
})
export class SignupComponent implements OnInit, OnDestroy {
  signupForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showPassword = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getControl(controlName: string): AbstractControl | null {
    return this.signupForm.get(controlName);
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.getControl(controlName);
    return !!(control?.hasError(errorType) && control?.touched);
  }

  async onSubmit(): Promise<void> {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.signupForm.value;

    // ✅ Only send what the backend expects
    const payload = {
      username: formValue.username,
      password: formValue.password,
    };

    try {
      const result = await this.authService.signup(payload).toPromise();
      this.successMessage = 'Account created successfully!';
      this.signupForm.reset();
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (error: any) {
      this.errorMessage = error?.error || 'Signup failed. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
