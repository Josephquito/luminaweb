import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CatalogService, Producto } from '../../services/catalog.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './catalogo.page.html',
  styleUrl: './catalogo.page.css',
})
export class CatalogoPage implements OnInit {
  private catalog = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  marcas = signal<{ id: number; nombre: string }[]>([]);
  categorias = signal<{ id: number; nombre: string }[]>([]);
  marcasOriginales = signal<{ id: number; nombre: string }[]>([]);
  categoriasOriginales = signal<{ id: number; nombre: string }[]>([]);

  cargando = signal(false);
  drawerAbierto = signal(false);

  buscar = '';
  marcaSeleccionada = '';
  categoriaSeleccionada = '';

  paginaActual = 1;
  totalPaginas = 1;
  totalProductos = 0;
  limit = 20;

  private buscarSubject = new Subject<string>();
  private iniciado = false;

  ngOnInit() {
    if (this.iniciado) return;
    this.iniciado = true;

    this.route.queryParams.subscribe((params) => {
      this.buscar = params['buscar'] || '';
      this.marcaSeleccionada = params['marca'] || '';
      this.categoriaSeleccionada = params['categoria'] || '';
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
      .getProducts({
        buscar: this.buscar || undefined,
        marca: this.marcaSeleccionada || undefined,
        categoria: this.categoriaSeleccionada || undefined,
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

          // Si hay búsqueda activa, usar opciones filtradas
          // Si no hay búsqueda, guardar como originales y usar esas
          if (this.buscar) {
            this.marcas.set(res.marcasDisponibles);
            this.categorias.set(res.categoriasDisponibles);
          } else {
            // Solo actualizar originales si no hay filtro de marca/categoria activo
            if (!this.marcaSeleccionada && !this.categoriaSeleccionada) {
              this.marcasOriginales.set(res.marcasDisponibles);
              this.categoriasOriginales.set(res.categoriasDisponibles);
            }
            this.marcas.set(this.marcasOriginales());
            this.categorias.set(this.categoriasOriginales());
          }
        },
        error: () => this.cargando.set(false),
      });
  }

  actualizarUrl(pagina = 1) {
    const queryParams: any = {};
    if (this.buscar) queryParams['buscar'] = this.buscar;
    if (this.marcaSeleccionada) queryParams['marca'] = this.marcaSeleccionada;
    if (this.categoriaSeleccionada) queryParams['categoria'] = this.categoriaSeleccionada;
    if (pagina > 1) queryParams['page'] = pagina;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });
  }

  aplicarFiltros() {
    this.drawerAbierto.set(false);
    this.actualizarUrl(1);
  }

  limpiarFiltros() {
    this.buscar = '';
    this.marcaSeleccionada = '';
    this.categoriaSeleccionada = '';
    this.drawerAbierto.set(false);
    this.actualizarUrl(1);
  }

  onBuscarChange(valor: string) {
    this.buscar = valor;
    this.marcaSeleccionada = '';
    this.categoriaSeleccionada = '';
    this.buscarSubject.next(valor);
  }

  onBuscarEnter() {
    this.marcaSeleccionada = '';
    this.categoriaSeleccionada = '';
    this.actualizarUrl(1);
  }

  get hayFiltrosActivos(): boolean {
    return !!(this.buscar || this.marcaSeleccionada || this.categoriaSeleccionada);
  }

  get paginas(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.paginaActual - 2);
    const end = Math.min(this.totalPaginas, this.paginaActual + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  getImagenPrincipal(producto: any): string {
    if (producto.imagenes?.length) return producto.imagenes[0].url;
    return '/placeholder.png';
  }

  getNombreProducto(producto: any): string {
    return producto.nombreWeb || producto.nombre;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = '/placeholder.png';
  }
}
