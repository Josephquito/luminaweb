import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { TarifasComponent } from './components/tarifas/tarifas.component';
import { ComisionesComponent } from './components/comisiones/comisiones.component';

type Tab = 'usuarios' | 'tarifas' | 'comisiones';
const TABS: Tab[] = ['usuarios', 'tarifas', 'comisiones'];
const STORAGE_KEY = 'lumina_admin_tab';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, UsuariosComponent, TarifasComponent, ComisionesComponent],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.css',
})
export class AdminPage {
  tabActiva = signal<Tab>(this.cargarTab());

  private cargarTab(): Tab {
    const saved = localStorage.getItem(STORAGE_KEY) as Tab;
    return TABS.includes(saved) ? saved : 'usuarios';
  }

  setTab(tab: Tab) {
    this.tabActiva.set(tab);
    localStorage.setItem(STORAGE_KEY, tab);
  }
}
