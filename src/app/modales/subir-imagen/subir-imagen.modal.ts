import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImagesService } from '../../services/images.service';

interface Preview {
  file: File;
  url: string;
  nombre: string;
}

interface ImagenExistente {
  id: number;
  url: string;
  orden: number;
  productoId?: number;
}

@Component({
  selector: 'app-subir-imagen-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subir-imagen.modal.html',
  styleUrl: './subir-imagen.modal.css',
})
export class SubirImagenModal {
  @Input() productoId!: number;
  @Input() imagenesExistentes: ImagenExistente[] = [];
  @Output() cerrar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<void>();

  private imagesService = inject(ImagesService);

  previews = signal<Preview[]>([]);
  subiendo = signal(false);
  eliminando = signal<number | null>(null);
  progreso = signal(0);
  error = '';

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const nuevas: Preview[] = [];
    Array.from(input.files).forEach((file) => {
      const url = URL.createObjectURL(file);
      nuevas.push({ file, url, nombre: file.name });
    });

    this.previews.set([...this.previews(), ...nuevas]);
    input.value = '';
  }

  quitarPreview(index: number) {
    const lista = [...this.previews()];
    URL.revokeObjectURL(lista[index].url);
    lista.splice(index, 1);
    this.previews.set(lista);
  }

  async subirTodas() {
    if (!this.previews().length) return;

    this.subiendo.set(true);
    this.error = '';
    this.progreso.set(0);

    const lista = this.previews();
    const ordenInicial = this.imagenesExistentes.length;

    for (let i = 0; i < lista.length; i++) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.imagesService
            .subirImagen(this.productoId, lista[i].file, ordenInicial + i)
            .subscribe({ next: () => resolve(), error: reject });
        });
        this.progreso.set(Math.round(((i + 1) / lista.length) * 100));
      } catch {
        this.error = `Error al subir "${lista[i].nombre}"`;
        this.subiendo.set(false);
        return;
      }
    }

    this.previews().forEach((p) => URL.revokeObjectURL(p.url));
    this.previews.set([]);
    this.subiendo.set(false);
    this.actualizado.emit();
  }

  eliminarExistente(imagen: ImagenExistente) {
    this.eliminando.set(imagen.id);
    this.imagesService.eliminarImagen(imagen.id).subscribe({
      next: () => {
        this.eliminando.set(null);
        this.actualizado.emit();
      },
      error: () => this.eliminando.set(null),
    });
  }

  onCerrar() {
    this.previews().forEach((p) => URL.revokeObjectURL(p.url));
    this.previews.set([]);
    this.cerrar.emit();
  }
}
