import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService, Usuario } from '../../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.page.html',
  styleUrl: './usuarios.page.css',
})
export class UsuariosPage implements OnInit {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(false);

  // Modal crear/editar
  modalAbierto = signal(false);
  modoEditar = signal(false);
  usuarioEditando = signal<Usuario | null>(null);
  guardando = signal(false);
  errorModal = '';

  // Modal eliminar
  confirmarEliminar = signal(false);
  usuarioAEliminar = signal<Usuario | null>(null);
  eliminando = signal(false);

  form: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.minLength(6)],
    rol: ['VENDEDOR', Validators.required],
  });

  get nombre() {
    return this.form.get('nombre')!;
  }
  get email() {
    return this.form.get('email')!;
  }
  get password() {
    return this.form.get('password')!;
  }
  get rol() {
    return this.form.get('rol')!;
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando.set(true);
    this.auth.getUsuarios().subscribe({
      next: (u) => {
        this.usuarios.set(u);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear() {
    this.modoEditar.set(false);
    this.usuarioEditando.set(null);
    this.errorModal = '';
    this.form.reset({ rol: 'VENDEDOR' });
    this.form.get('password')!.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')!.updateValueAndValidity();
    this.modalAbierto.set(true);
  }

  abrirEditar(usuario: Usuario) {
    this.modoEditar.set(true);
    this.usuarioEditando.set(usuario);
    this.errorModal = '';
    this.form.patchValue({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      password: '',
    });
    this.form.get('password')!.clearValidators();
    this.form.get('password')!.updateValueAndValidity();
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.form.reset();
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorModal = '';

    if (this.modoEditar()) {
      const id = this.usuarioEditando()!.id;
      const data: any = {
        nombre: this.nombre.value,
        email: this.email.value,
      };
      if (this.password.value) data.password = this.password.value;

      this.auth.editarUsuario(id, data).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: (err) => {
          this.errorModal = err.error?.message || 'Error al editar usuario';
          this.guardando.set(false);
        },
      });
    } else {
      this.auth
        .crearUsuario({
          nombre: this.nombre.value,
          email: this.email.value,
          password: this.password.value,
          rol: 'VENDEDOR', // siempre vendedor
        })
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.cerrarModal();
            this.cargarUsuarios();
          },
          error: (err) => {
            this.errorModal = err.error?.message || 'Error al crear usuario';
            this.guardando.set(false);
          },
        });
    }
  }

  abrirEliminar(usuario: Usuario) {
    this.usuarioAEliminar.set(usuario);
    this.confirmarEliminar.set(true);
  }

  cerrarEliminar() {
    this.confirmarEliminar.set(false);
    this.usuarioAEliminar.set(null);
  }

  eliminar() {
    const id = this.usuarioAEliminar()!.id;
    this.eliminando.set(true);
    this.auth.eliminarUsuario(id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.cerrarEliminar();
        this.cargarUsuarios();
      },
      error: () => this.eliminando.set(false),
    });
  }

  toggle(usuario: Usuario) {
    this.auth.toggleActivo(usuario.id).subscribe({
      next: () => this.cargarUsuarios(),
    });
  }

  get usuarioActual() {
    return this.auth.currentUser();
  }
}
