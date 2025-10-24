import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/AuthService';

@Component({
  selector: 'app-login-componant',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login-componant.html',
  styleUrls: ['./login-componant.css'],
})
export class LoginComponant {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      this.router.navigate(['/dashboard']);
    }
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { username, password, rememberMe } = this.loginForm.value;

    console.log('Sending login request to backend:', { username });

    // 🔥 Real API call — no more local check
    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        console.log('✅ Login successful. Backend response:', response);

        // Example: { token: "...", user: { id, username, ... } }
        if (response?.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('username', response.user?.username || username);

          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }

          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Login failed: Invalid response from server.';
        }

        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('❌ Login failed. Error from backend:', err);
        this.errorMessage =
          err?.error?.message || 'Invalid username or password.';
        this.isSubmitting = false;
      },
    });
  }
}
