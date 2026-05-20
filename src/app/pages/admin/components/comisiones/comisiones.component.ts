import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FilaComision {
  id: number;
  nFactura: string;
  valorFactura: number | null;
}

@Component({
  selector: 'app-comisiones-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comisiones.component.html',
  styleUrl: './comisiones.component.css',
})
export class ComisionesComponent {
  private readonly STORAGE_KEY = 'lumina_comisiones';

  porcentaje = 20;
  filas = signal<FilaComision[]>(this.cargarDesdeStorage());
  private nextId = Math.max(...this.filas().map((f) => f.id), 0) + 1;

  private filaVacias(): FilaComision[] {
    return Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      nFactura: '',
      valorFactura: null,
    }));
  }

  private cargarDesdeStorage(): FilaComision[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : this.filaVacias();
    } catch {
      return this.filaVacias();
    }
  }

  private guardarEnStorage() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.filas()));
  }

  valorBase(fila: FilaComision): number {
    if (!fila.valorFactura) return 0;
    return fila.valorFactura / 1.15;
  }

  get totalBase(): number {
    return this.filas().reduce((acc, f) => acc + this.valorBase(f), 0);
  }

  get comisionTotal(): number {
    return this.totalBase * (this.porcentaje / 100);
  }

  guardar() {
    this.guardarEnStorage();
  }

  agregarFila() {
    this.filas.update((f) => [...f, { id: this.nextId++, nFactura: '', valorFactura: null }]);
    this.guardarEnStorage();
  }

  eliminarFila(id: number) {
    this.filas.update((f) => f.filter((fila) => fila.id !== id));
    this.guardarEnStorage();
  }

  limpiarTodo() {
    this.filas.set(this.filaVacias());
    this.nextId = 4;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  trackById(index: number, fila: FilaComision) {
    return fila.id;
  }
}
