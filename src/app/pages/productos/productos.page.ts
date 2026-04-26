import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CatalogService, Producto } from '../../services/catalog.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.page.html',
  styleUrl: './productos.page.css',
})
export class ProductosPage implements OnInit {
  private catalog = inject(CatalogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  productos = signal<Producto[]>([]);
  marcas = signal<{ id: number; nombre: string }[]>([]);
  categorias = signal<{ id: number; nombre: string }[]>([]);
  cargando = signal(false);

  buscar = '';
  marcaSeleccionada = '';
  categoriaSeleccionada = '';
  filtroExtra = '';

  paginaActual = 1;
  totalPaginas = 1;
  totalProductos = 0;
  limit = 50;

  isSyncing = signal(false);

  private buscarSubject = new Subject<string>();
  private iniciado = false;

  ngOnInit() {
    if (this.iniciado) return;
    this.iniciado = true;

    this.catalog.getMarcas().subscribe((m) => this.marcas.set(m));
    this.catalog.getCategorias().subscribe((c) => this.categorias.set(c));

    this.route.queryParams.subscribe((params) => {
      this.buscar = params['buscar'] || '';
      this.marcaSeleccionada = params['marca'] || '';
      this.categoriaSeleccionada = params['categoria'] || '';
      this.filtroExtra = params['filtro'] || '';
      this.paginaActual = params['page'] ? parseInt(params['page']) : 1;
      this.cargarProductos(this.paginaActual, false);
    });

    this.buscarSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.actualizarUrl(1));
  }

  cargarProductos(pagina = 1, scrollTop = true) {
    this.cargando.set(true);
    this.paginaActual = pagina;

    this.catalog
      .getProductsAdmin({
        buscar: this.buscar || undefined,
        marca: this.marcaSeleccionada || undefined,
        categoria: this.categoriaSeleccionada || undefined,
        filtroExtra: this.filtroExtra || undefined,
        page: pagina,
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.productos.set(res.data);
          this.totalPaginas = res.meta.totalPages;
          this.totalProductos = res.meta.total;
          this.cargando.set(false);
          if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: () => this.cargando.set(false),
      });
  }

  actualizarUrl(pagina = 1) {
    const queryParams: any = {};
    if (this.buscar) queryParams['buscar'] = this.buscar;
    if (this.marcaSeleccionada) queryParams['marca'] = this.marcaSeleccionada;
    if (this.categoriaSeleccionada) queryParams['categoria'] = this.categoriaSeleccionada;
    if (this.filtroExtra) queryParams['filtro'] = this.filtroExtra;
    if (pagina > 1) queryParams['page'] = pagina;
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }

  onBuscarChange(valor: string) {
    this.buscar = valor;
    this.buscarSubject.next(valor);
  }

  aplicarFiltros() {
    this.actualizarUrl(1);
  }

  limpiarFiltros() {
    this.buscar = '';
    this.marcaSeleccionada = '';
    this.categoriaSeleccionada = '';
    this.filtroExtra = '';
    this.actualizarUrl(1);
  }

  get hayFiltrosActivos(): boolean {
    return !!(
      this.buscar ||
      this.marcaSeleccionada ||
      this.categoriaSeleccionada ||
      this.filtroExtra
    );
  }

  get paginas(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.paginaActual - 2);
    const end = Math.min(this.totalPaginas, this.paginaActual + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  irProducto(id: number) {
    this.router.navigate(['/producto', id]);
  }

  getImagen(producto: Producto): string {
    if (producto.imagenes?.length) return producto.imagenes[0].url;
    return '/placeholder.png';
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = '/placeholder.png';
  }

  tieneDescCorta(p: Producto): boolean {
    return !!p.descripcionCorta;
  }
  tieneDescLarga(p: Producto): boolean {
    return !!p.descripcionLarga;
  }

  exportarCSV() {
    this.catalog
      .getAllProducts({
        marca: this.marcaSeleccionada || undefined,
        categoria: this.categoriaSeleccionada || undefined,
        buscar: this.buscar || undefined,
        filtroExtra: this.filtroExtra || undefined,
      })
      .subscribe((todos) => {
        const headers = [
          'ID Odoo',
          'Nombre',
          'Nombre Web',
          'SKU',
          'Marca',
          'Categoría',
          'Precio',
          'Stock',
          'Desc. Corta',
          'Desc. Larga',
          'Grupo Variante',
          'Publicado',
          'Imágenes',
          'Actualizado',
        ];

        const filas = todos.map((p) => [
          p.odooId,
          `"${p.nombre}"`,
          `"${p.nombreWeb || ''}"`,
          p.sku || '',
          p.marca?.nombre || '',
          p.categoria?.nombre || '',
          p.precio,
          p.stock,
          p.descripcionCorta ? 'Sí' : 'No',
          p.descripcionLarga ? 'Sí' : 'No',
          `"${p.grupoVariante || ''}"`,
          p.publicarWeb ? 'Sí' : 'No',
          p.imagenes?.length || 0,
          p.actualizadoEn ? new Date(p.actualizadoEn).toLocaleDateString() : '',
        ]);

        const csv = [headers.join(','), ...filas.map((f) => f.join(','))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `productos-lumina-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  syncProductos() {
    this.isSyncing.set(true);
    this.catalog.syncProductos().subscribe({
      next: (result) => {
        this.isSyncing.set(false);
        this.cargarProductos(this.paginaActual, false);
      },
      error: () => this.isSyncing.set(false),
    });
  }
}
