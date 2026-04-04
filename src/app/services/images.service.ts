import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductoImagen {
  id: number;
  url: string;
  orden: number;
  productoId?: number;
}

@Injectable({ providedIn: 'root' })
export class ImagesService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/images`;

  getImagenes(productoId: number): Observable<ProductoImagen[]> {
    return this.http.get<ProductoImagen[]>(`${this.api}/${productoId}`);
  }

  subirImagen(productoId: number, file: File, orden = 0): Observable<ProductoImagen> {
    const form = new FormData();
    form.append('imagen', file);
    form.append('orden', String(orden));
    return this.http.post<ProductoImagen>(`${this.api}/${productoId}`, form);
  }

  eliminarImagen(imagenId: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.api}/${imagenId}`);
  }
}
