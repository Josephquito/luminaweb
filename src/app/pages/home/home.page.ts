import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CatalogService } from '../../services/catalog.service';
import { SiteMediaModal } from '../../modales/site-media/site-media-modal';
import { SiteMediaService, SiteMedia } from '../../services/site-media.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SiteMediaModal],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
})
export class HomePage implements OnInit, AfterViewInit {
  private catalog = inject(CatalogService);
  private router = inject(Router);
  private siteMedia = inject(SiteMediaService);
  auth = inject(AuthService);

  @ViewChild('marcasScroll') marcasScrollRef!: ElementRef<HTMLDivElement>;

  marcas = signal<{ id: number; nombre: string }[]>([]);
  fotosTienda = signal<SiteMedia[]>([]);
  modalTiendaAbierto = signal(false);

  ngOnInit() {
    this.catalog.getMarcas().subscribe((m) => this.marcas.set(m));
    this.cargarFotosTienda();
  }

  cargarFotosTienda() {
    this.siteMedia.getByKey('tienda').subscribe((f) => this.fotosTienda.set(f));
  }

  ngAfterViewInit() {
    const el = this.marcasScrollRef.nativeElement;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    el.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });

    el.addEventListener('mouseleave', () => (isDown = false));
    el.addEventListener('mouseup', () => (isDown = false));

    el.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    });
  }

  irCatalogo() {
    this.router.navigate(['/catalogo']);
  }

  irMarca(nombre: string) {
    this.router.navigate(['/catalogo'], { queryParams: { marca: nombre } });
  }

  onLogoError(event: Event, nombre: string) {
    const img = event.target as HTMLImageElement;
    const extensiones = ['jpg', 'webp', 'png'];
    const actual = img.src.split('.').pop();
    const siguiente = extensiones[extensiones.indexOf(actual!) + 1];

    if (siguiente) {
      const slug = this.getSlug(nombre);
      img.src = `/marcas/${slug}.${siguiente}`;
    } else {
      img.style.display = 'none';
      const fallback = img.nextElementSibling as HTMLElement;
      if (fallback) fallback.style.display = 'flex';
    }
  }

  getSlug(nombre: string): string {
    return nombre
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[áàä]/g, 'a')
      .replace(/[éèë]/g, 'e')
      .replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o')
      .replace(/[úùü]/g, 'u')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  getLogoMarca(nombre: string): string {
    return `/marcas/${this.getSlug(nombre)}.png`;
  }

  get marcasDuplicadas() {
    const m = this.marcas();
    return [...m, ...m];
  }
}
