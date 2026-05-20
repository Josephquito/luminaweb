import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CatalogService, Producto } from '../../services/catalog.service';
import { AuthService } from '../../services/auth.service';
import { CotizadorComponent } from '../../shared/cotizador/cotizador.component';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CotizadorComponent],
  templateUrl: './catalogo.page.html',
  styleUrl: './catalogo.page.css',
})
export class CatalogoPage implements OnInit {
  private catalog = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private scroller = inject(ViewportScroller);
  private readonly SCROLL_KEY = 'lumina_catalogo_scroll';
  private readonly PAGE_KEY = 'lumina_catalogo_page';

  auth = inject(AuthService);

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

  skuCopiados = new Set<string>();

  private buscarSubject = new Subject<string>();
  private iniciado = false;

  @ViewChild(CotizadorComponent) cotizadorRef!: CotizadorComponent;

  guardarPosicion() {
    sessionStorage.setItem(this.SCROLL_KEY, window.scrollY.toString());
    sessionStorage.setItem(this.PAGE_KEY, this.paginaActual.toString());
  }

  agregarACotizador(event: Event, producto: any) {
    event.preventDefault();
    event.stopPropagation();
    this.cotizadorRef.agregarProducto({
      id: producto.id,
      nombreWeb: producto.nombreWeb || producto.nombre,
      marca: producto.marca,
      precio: producto.precio,
      sku: producto.sku,
      stock: producto.stock,
      imagenes: producto.imagenes ?? [], // agrega esto
    });
    this.cotizadorRef.pulse();
  }

  copiarSku(event: Event, sku: string) {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(sku);
    this.skuCopiados.add(sku);
    setTimeout(() => this.skuCopiados.delete(sku), 1500);
  }

  skuCopiado(sku: string): boolean {
    return this.skuCopiados.has(sku);
  }

  ngOnInit() {
    if (this.iniciado) return;
    this.iniciado = true;

    this.route.queryParams.subscribe((params) => {
      this.buscar = params['buscar'] || '';
      this.marcaSeleccionada = params['marca'] || '';
      this.categoriaSeleccionada = params['categoria'] || '';

      const savedPage = sessionStorage.getItem(this.PAGE_KEY);
      this.paginaActual = params['page']
        ? parseInt(params['page'])
        : savedPage
          ? parseInt(savedPage)
          : 1;

      const restaurar = !!sessionStorage.getItem(this.SCROLL_KEY);
      this.cargarProductos(this.paginaActual, false, restaurar);
    });

    this.buscarSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.actualizarUrl(1));
  }

  cargarProductos(pagina = 1, scrollTop = true, restaurar = false) {
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

          if (restaurar) {
            const savedScroll = sessionStorage.getItem(this.SCROLL_KEY);
            if (savedScroll) {
              setTimeout(() => {
                window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' });
                sessionStorage.removeItem(this.SCROLL_KEY);
                sessionStorage.removeItem(this.PAGE_KEY);
              }, 50);
            }
          } else if (scrollTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }

          if (this.buscar) {
            this.marcas.set(res.marcasDisponibles);
            this.categorias.set(res.categoriasDisponibles);
          } else {
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
