import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteMediaService, SiteMedia } from '../../services/site-media.service';

interface Preview {
  file: File;
  url: string;
  nombre: string;
}

@Component({
  selector: 'app-site-media-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './site-media.modal.html',
  styleUrl: './site-media.modal.css',
})
export class SiteMediaModal {
  @Input() mediaKey!: string;
  @Input() imagenesExistentes: SiteMedia[] = [];
  @Output() cerrar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<void>();

  private service = inject(SiteMediaService);

  previews = signal<Preview[]>([]);
  subiendo = signal(false);
  eliminando = signal<number | null>(null);
  progreso = signal(0);
  error = '';
  dropActivo = signal(false);
  dragIndex = signal<number | null>(null);
  dragOverIndex = signal<number | null>(null);
  guardandoOrden = false;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const nuevas: Preview[] = [];
    Array.from(input.files).forEach((file) => {
      nuevas.push({ file, url: URL.createObjectURL(file), nombre: file.name });
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
          this.service
            .subir(this.mediaKey, lista[i].file, ordenInicial + i)
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

  eliminarExistente(media: SiteMedia) {
    this.eliminando.set(media.id);
    this.service.eliminar(media.id).subscribe({
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

  onDropZoneDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropActivo.set(true);
  }

  onDropZoneDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dropActivo.set(false);
  }

  onDropZoneDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropActivo.set(false);
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    const nuevas: Preview[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      nuevas.push({ file, url: URL.createObjectURL(file), nombre: file.name });
    });
    this.previews.set([...this.previews(), ...nuevas]);
  }

  onDragStart(event: DragEvent, index: number) {
    this.dragIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverIndex.set(index);
  }

  onDragLeave() {
    this.dragOverIndex.set(null);
  }
  onDragEnd() {
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
  }

  onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    const from = this.dragIndex();
    if (from === null || from === index) {
      this.dragIndex.set(null);
      this.dragOverIndex.set(null);
      return;
    }
    const lista = [...this.imagenesExistentes];
    const [movido] = lista.splice(from, 1);
    lista.splice(index, 0, movido);
    const reordenadas = lista.map((img, i) => ({ ...img, orden: i }));
    this.imagenesExistentes = reordenadas;
    this.guardandoOrden = true;
    this.service.reordenar(reordenadas.map((img) => ({ id: img.id, orden: img.orden }))).subscribe({
      next: () => {
        this.guardandoOrden = false;
        this.actualizado.emit();
      },
      error: () => (this.guardandoOrden = false),
    });
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
  }
}
