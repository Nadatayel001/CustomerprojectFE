import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // ✅ Match your backend’s actual URL and port
  private readonly baseUrl = 'http://localhost:5197/api';

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap((response: any) => {
        console.log('✅ Login response:', response);
        if (response?.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('isLoggedIn', 'true');
           localStorage.setItem('role', response.roleName); 
        }
      })
    );
  }
signup(model: { username: string; password: string }): Observable<any> {
return this.http.post<any>(`${this.baseUrl}/users`, model).pipe(    tap((response: any) => {
      if (response?.id) {
        console.log('User created with ID:', response.id);
      }
    })
  );
}
isAdmin(): boolean {
  debugger
  return localStorage.getItem('role')?.toLowerCase() === 'admin';
}

isUser(): boolean {
  return localStorage.getItem('role')?.toLowerCase() === 'user';
}

getCurrentRole(): string | null {
  debugger
  return localStorage.getItem('role');
}


  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
}
