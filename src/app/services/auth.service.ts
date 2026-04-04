import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'VENDEDOR';
  activo?: boolean;
  creadoEn?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private api = `${environment.apiUrl}/api/auth`;

  currentUser = signal<Usuario | null>(this.getUsuarioFromStorage());

  login(email: string, password: string) {
    return this.http
      .post<{ access_token: string; usuario: Usuario }>(`${this.api}/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem('token', res.access_token);
          localStorage.setItem('usuario', JSON.stringify(res.usuario));
          this.currentUser.set(res.usuario);
        }),
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.currentUser()?.rol === 'ADMIN';
  }

  // ─── Gestión de usuarios (solo ADMIN) ────────────────────────────────────────

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.api}/usuarios`);
  }

  crearUsuario(data: {
    nombre: string;
    email: string;
    password: string;
    rol: 'ADMIN' | 'VENDEDOR';
  }): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.api}/usuarios`, data);
  }

  editarUsuario(
    id: number,
    data: { nombre?: string; email?: string; rol?: 'ADMIN' | 'VENDEDOR' },
  ): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.api}/usuarios/${id}`, data);
  }

  toggleActivo(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.api}/usuarios/${id}/toggle`, {});
  }

  eliminarUsuario(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.api}/usuarios/${id}`);
  }

  cambiarPassword(passwordActual: string, passwordNuevo: string): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.api}/password`, {
      passwordActual,
      passwordNuevo,
    });
  }

  private getUsuarioFromStorage(): Usuario | null {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }
}
