import { Component, inject, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  cargando = false;
  error = '';
  mostrarPassword = false;

  get email() {
    return this.form.get('email')!;
  }
  get password() {
    return this.form.get('password')!;
  }

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.error = '';

    this.auth.login(this.email.value, this.password.value).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.cargando = false;
          this.router.navigate(['/']);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.error =
            err.status === 401
              ? 'Correo o contraseña incorrectos'
              : 'Error al iniciar sesión, intenta de nuevo';
          this.cargando = false;
        });
      },
    });
  }
}
