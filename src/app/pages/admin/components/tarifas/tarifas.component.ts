import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CotizadorService, TarifaEnvio } from '../../../../services/cotizador.service';

@Component({
  selector: 'app-tarifas-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tarifas.component.html',
  styleUrl: './tarifas.component.css',
})
export class TarifasComponent implements OnInit {
  private cotizador = inject(CotizadorService);

  tarifas = signal<TarifaEnvio[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  eliminando = signal<number | null>(null);

  // Modal crear/editar
  modalAbierto = signal(false);
  modoEditar = signal(false);
  tarifaEditando = signal<TarifaEnvio | null>(null);
  formDestino = '';
  formTarifa: number | null = null;
  errorModal = '';

  // Modal eliminar
  confirmarEliminar = signal(false);
  tarifaAEliminar = signal<TarifaEnvio | null>(null);

  ngOnInit() {
    this.cargarTarifas();
  }

  cargarTarifas() {
    this.cargando.set(true);
    this.cotizador.getTarifas().subscribe({
      next: (t) => {
        this.tarifas.set(t);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear() {
    this.modoEditar.set(false);
    this.tarifaEditando.set(null);
    this.formDestino = '';
    this.formTarifa = null;
    this.errorModal = '';
    this.modalAbierto.set(true);
  }

  abrirEditar(tarifa: TarifaEnvio) {
    this.modoEditar.set(true);
    this.tarifaEditando.set(tarifa);
    this.formDestino = tarifa.destino;
    this.formTarifa = tarifa.tarifa;
    this.errorModal = '';
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  guardar() {
    if (!this.formDestino.trim() || this.formTarifa === null) {
      this.errorModal = 'Completa todos los campos';
      return;
    }
    this.guardando.set(true);
    this.errorModal = '';

    const obs = this.modoEditar()
      ? this.cotizador.updateTarifa(
          this.tarifaEditando()!.id,
          this.formDestino.trim(),
          this.formTarifa,
        )
      : this.cotizador.createTarifa(this.formDestino.trim(), this.formTarifa);

    obs.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarTarifas();
      },
      error: (err) => {
        this.errorModal = err.error?.message || 'Error al guardar';
        this.guardando.set(false);
      },
    });
  }

  abrirEliminar(tarifa: TarifaEnvio) {
    this.tarifaAEliminar.set(tarifa);
    this.confirmarEliminar.set(true);
  }
  cerrarEliminar() {
    this.confirmarEliminar.set(false);
    this.tarifaAEliminar.set(null);
  }

  eliminar() {
    const id = this.tarifaAEliminar()!.id;
    this.eliminando.set(id);
    this.cotizador.deleteTarifa(id).subscribe({
      next: () => {
        this.eliminando.set(null);
        this.cerrarEliminar();
        this.cargarTarifas();
      },
      error: () => this.eliminando.set(null),
    });
  }
}
