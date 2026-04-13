import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SiteMedia {
  id: number;
  url: string;
  orden: number;
  key: string;
}

@Injectable({ providedIn: 'root' })
export class SiteMediaService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/site-media`;

  getByKey(key: string): Observable<SiteMedia[]> {
    return this.http.get<SiteMedia[]>(`${this.api}?key=${key}`);
  }

  subir(key: string, file: File, orden = 0): Observable<SiteMedia> {
    const form = new FormData();
    form.append('imagen', file);
    form.append('orden', String(orden));
    return this.http.post<SiteMedia>(`${this.api}?key=${key}`, form);
  }

  eliminar(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.api}/${id}`);
  }

  reordenar(items: { id: number; orden: number }[]): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.api}/reorder`, { items });
  }
}
