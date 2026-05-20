import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductoCotizador {
  id: number;
  nombreWeb: string;
  marca: { id: number; nombre: string } | null;
  precio: number;
  sku: string | null;
  stock: number;
}

export interface ItemCotizador {
  producto: ProductoCotizador;
  cantidad: number;
}

export interface TarifaEnvio {
  id: number;
  destino: string;
  tarifa: number;
}

@Injectable({ providedIn: 'root' })
export class CotizadorService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/cotizador`;

  buscarProductos(q: string): Observable<ProductoCotizador[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<ProductoCotizador[]>(`${this.api}/buscar`, { params });
  }

  getTarifas(): Observable<TarifaEnvio[]> {
    return this.http.get<TarifaEnvio[]>(`${this.api}/tarifas`);
  }

  createTarifa(destino: string, tarifa: number): Observable<TarifaEnvio> {
    return this.http.post<TarifaEnvio>(`${this.api}/tarifas`, { destino, tarifa });
  }

  updateTarifa(id: number, destino: string, tarifa: number): Observable<TarifaEnvio> {
    return this.http.patch<TarifaEnvio>(`${this.api}/tarifas/${id}`, { destino, tarifa });
  }

  deleteTarifa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/tarifas/${id}`);
  }
}
