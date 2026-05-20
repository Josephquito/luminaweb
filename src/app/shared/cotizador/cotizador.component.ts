import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  CotizadorService,
  ProductoCotizador,
  TarifaEnvio,
  ItemCotizador,
} from '../../services/cotizador.service';

@Component({
  selector: 'app-cotizador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cotizador.component.html',
  styleUrl: './cotizador.component.css',
})
export class CotizadorComponent implements OnInit {
  private cotizador = inject(CotizadorService);
  private readonly STORAGE_KEY = 'lumina_cotizador';

  private cargarItems(): ItemCotizador[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private guardarItems() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items()));
  }

  // Estado drawer
  abierto = signal(false);

  // Búsqueda
  busqueda = '';
  resultados = signal<ProductoCotizador[]>([]);
  buscando = signal(false);
  mostrarResultados = signal(false);
  private buscarSubject = new Subject<string>();

  // Items
  items = signal<ItemCotizador[]>(this.cargarItems());

  // Tarifas
  tarifas = signal<TarifaEnvio[]>([]);
  tarifaSeleccionada = signal<TarifaEnvio | null>(null);

  // Descuento
  descuento = 0;

  // Copiar
  copiado = signal(false);

  // Animación
  animando = signal(false);

  ngOnInit() {
    this.cotizador.getTarifas().subscribe((t) => this.tarifas.set(t));

    this.buscarSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((q) => this.ejecutarBusqueda(q));
  }

  // ─── Animación ─────────────────────────────────────────────────────────────────
  pulse() {
    this.animando.set(true);
    setTimeout(() => this.animando.set(false), 600);
  }

  // ─── Drawer ──────────────────────────────────────────────────────────────────

  abrir() {
    this.abierto.set(true);
  }
  cerrar() {
    this.abierto.set(false);
    this.mostrarResultados.set(false);
  }

  // ─── Búsqueda ─────────────────────────────────────────────────────────────────

  onBusquedaChange(valor: string) {
    this.busqueda = valor;
    if (!valor.trim()) {
      this.resultados.set([]);
      this.mostrarResultados.set(false);
      return;
    }
    this.buscarSubject.next(valor);
  }

  private ejecutarBusqueda(q: string) {
    if (!q.trim()) return;
    this.buscando.set(true);
    this.cotizador.buscarProductos(q).subscribe({
      next: (res) => {
        this.resultados.set(res);
        this.mostrarResultados.set(true);
        this.buscando.set(false);
      },
      error: () => this.buscando.set(false),
    });
  }

  // ─── Items ────────────────────────────────────────────────────────────────────

  agregarProducto(producto: ProductoCotizador) {
    const actual = this.items();
    const existe = actual.find((i) => i.producto.id === producto.id);
    if (existe) {
      this.items.set(
        actual.map((i) => (i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)),
      );
    } else {
      this.items.set([...actual, { producto, cantidad: 1 }]);
    }
    this.busqueda = '';
    this.resultados.set([]);
    this.mostrarResultados.set(false);
    this.guardarItems();
  }

  agregarDesdeCatalogo(producto: ProductoCotizador) {
    this.agregarProducto(producto);
    this.abrir();
  }

  eliminarItem(id: number) {
    this.items.update((items) => items.filter((i) => i.producto.id !== id));
    this.guardarItems();
  }

  cambiarCantidad(id: number, cantidad: number) {
    if (cantidad < 1) {
      this.eliminarItem(id);
      return;
    }
    this.items.update((items) => items.map((i) => (i.producto.id === id ? { ...i, cantidad } : i)));
    this.guardarItems();
  }

  vaciarCotizador() {
    this.items.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // ─── Cálculos ─────────────────────────────────────────────────────────────────

  get subtotal(): number {
    return this.items().reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0);
  }

  get descuentoValor(): number {
    const d = Math.min(Math.max(this.descuento, 0), 5);
    return this.subtotal * (d / 100);
  }

  get tarifaEnvio(): number {
    return this.tarifaSeleccionada()?.tarifa ?? 0;
  }

  get total(): number {
    return this.subtotal - this.descuentoValor + this.tarifaEnvio;
  }

  get totalItems(): number {
    return this.items().reduce((acc, i) => acc + i.cantidad, 0);
  }

  onDescuentoChange(valor: number) {
    this.descuento = Math.min(Math.max(valor, 0), 5);
  }

  seleccionarTarifa(id: string) {
    const tarifa = this.tarifas().find((t) => t.id === +id) ?? null;
    this.tarifaSeleccionada.set(tarifa);
  }

  // ─── Copiar cotización ────────────────────────────────────────────────────────

  copiarCotizacion() {
    const lineas = this.items().map((i) => {
      const subtotal = i.producto.precio * i.cantidad;
      const marca = i.producto.marca?.nombre ?? '';
      const nombre = `${i.cantidad}x ${i.producto.nombreWeb}${marca ? ' (' + marca + ')' : ''}`;
      return `${nombre.padEnd(45, '.')} $${subtotal.toFixed(2)}`;
    });

    const destino = this.tarifaSeleccionada()?.destino ?? 'No especificado';

    const texto = [
      'LUMINA - COTIZACIÓN',
      '─'.repeat(50),
      ...lineas,
      '─'.repeat(50),
      `Subtotal:                                      $${this.subtotal.toFixed(2)}`,
      this.descuento > 0
        ? `Descuento (${this.descuento}%):                            -$${this.descuentoValor.toFixed(2)}`
        : null,
      `Envío (${destino}):`,
      `                                               $${this.tarifaEnvio.toFixed(2)}`,
      '─'.repeat(50),
      `TOTAL:                                         $${this.total.toFixed(2)}`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(texto);
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2000);
  }
}
