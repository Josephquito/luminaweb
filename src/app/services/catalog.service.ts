import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Producto {
  id: number;
  odooId: number;
  nombre: string;
  nombreWeb: string | null;
  descripcionCorta: string | null;
  descripcionLarga: string | null;
  precio: number;
  precioBase: number;
  sku: string | null;
  stock: number;
  publicarWeb: boolean;
  grupoVariante: string | null;
  creadoEn: string;
  actualizadoEn: string;
  marca: { id: number; nombre: string } | null;
  categoria: { id: number; nombre: string } | null;
  imagenes: { id: number; url: string; orden: number; productoId?: number }[];
}

export interface FiltroOpcion {
  id: number;
  nombre: string;
}

export interface ProductosPaginados {
  data: Producto[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  marcasDisponibles: FiltroOpcion[];
  categoriasDisponibles: FiltroOpcion[];
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/catalog`;

  getProducts(
    filtros: {
      marca?: string;
      categoria?: string;
      buscar?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Observable<ProductosPaginados> {
    let params = new HttpParams();
    if (filtros.marca) params = params.set('marca', filtros.marca);
    if (filtros.categoria) params = params.set('categoria', filtros.categoria);
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    if (filtros.page) params = params.set('page', String(filtros.page));
    if (filtros.limit) params = params.set('limit', String(filtros.limit));
    return this.http.get<ProductosPaginados>(`${this.api}/products`, { params });
  }

  // Admin — productos paginados con filtros extra
  getProductsAdmin(
    filtros: {
      marca?: string;
      categoria?: string;
      buscar?: string;
      filtroExtra?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Observable<ProductosPaginados> {
    let params = new HttpParams();
    if (filtros.marca) params = params.set('marca', filtros.marca);
    if (filtros.categoria) params = params.set('categoria', filtros.categoria);
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    if (filtros.filtroExtra) params = params.set('filtroExtra', filtros.filtroExtra);
    if (filtros.page) params = params.set('page', String(filtros.page));
    if (filtros.limit) params = params.set('limit', String(filtros.limit));
    return this.http.get<ProductosPaginados>(`${this.api}/products/admin`, { params });
  }

  // Admin — todos sin paginación para exportar CSV
  getAllProducts(
    filtros: {
      marca?: string;
      categoria?: string;
      buscar?: string;
      filtroExtra?: string;
    } = {},
  ): Observable<Producto[]> {
    let params = new HttpParams();
    if (filtros.marca) params = params.set('marca', filtros.marca);
    if (filtros.categoria) params = params.set('categoria', filtros.categoria);
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    if (filtros.filtroExtra) params = params.set('filtroExtra', filtros.filtroExtra);
    return this.http.get<Producto[]>(`${this.api}/products/all`, { params });
  }

  getProductById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.api}/products/${id}`);
  }

  // Estos dos ya no se usan en el catálogo público pero los dejamos
  // por si el admin u otro módulo los necesita
  getMarcas(): Observable<FiltroOpcion[]> {
    return this.http.get<FiltroOpcion[]>(`${this.api}/marcas`);
  }

  getCategorias(): Observable<FiltroOpcion[]> {
    return this.http.get<FiltroOpcion[]>(`${this.api}/categorias`);
  }

  syncProductos(): Observable<any> {
    return this.http.post(`${this.api}/sync`, {});
  }
}
