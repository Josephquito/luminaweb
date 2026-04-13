import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CatalogService, Producto } from '../../services/catalog.service';
import { AuthService } from '../../services/auth.service';
import { SubirImagenModal } from '../../modales/subir-imagen/subir-imagen.modal';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, SubirImagenModal],
  templateUrl: './producto.page.html',
  styleUrl: './producto.page.css',
})
export class ProductoPage implements OnInit {
  private route = inject(ActivatedRoute);
  private catalog = inject(CatalogService);
  private location = inject(Location);
  auth = inject(AuthService);

  @ViewChild('sliderRef') sliderRef!: ElementRef<HTMLDivElement>;

  producto = signal<Producto | null>(null);
  cargando = signal(true);
  imagenActual = signal(0);
  modalImagenAbierto = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.catalog.getProductById(id).subscribe({
      next: (p) => {
        this.producto.set(p);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  get imagenes() {
    return this.producto()?.imagenes ?? [];
  }

  seleccionarImagen(index: number) {
    this.imagenActual.set(index);
    const slider = this.sliderRef?.nativeElement;
    if (!slider) return;
    slider.scrollTo({ left: slider.offsetWidth * index, behavior: 'smooth' });
  }

  anterior() {
    const total = this.imagenes.length;
    this.seleccionarImagen((this.imagenActual() - 1 + total) % total);
  }

  siguiente() {
    const total = this.imagenes.length;
    this.seleccionarImagen((this.imagenActual() + 1) % total);
  }

  onSliderScroll() {
    const slider = this.sliderRef?.nativeElement;
    if (!slider) return;
    const index = Math.round(slider.scrollLeft / slider.offsetWidth);
    this.imagenActual.set(index);
  }

  getNombre(): string {
    const p = this.producto();
    if (!p) return '';
    return p.nombreWeb || p.nombre;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = '/placeholder.png';
  }

  volver() {
    this.location.back();
  }

  abrirModalImagen() {
    this.modalImagenAbierto.set(true);
  }

  cerrarModalImagen() {
    this.modalImagenAbierto.set(false);
  }

  onImagenesActualizadas() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.catalog.getProductById(id).subscribe((p) => {
      this.producto.set(p);
      this.imagenActual.set(0);
    });
  }
}
