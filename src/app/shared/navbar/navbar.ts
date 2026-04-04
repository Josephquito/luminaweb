import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  imports: [RouterModule, CommonModule],
})
export class NavbarComponent {
  mobileOpen = false;
  navVisible = true;
  currentUrl = '';
  auth = inject(AuthService);

  private lastScrollTop = 0;
  private readonly showThreshold = 10;
  private readonly hideAfter = 80;

  @ViewChild('mobileMenu') mobileMenu!: ElementRef<HTMLElement>;

  constructor(private router: Router) {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.currentUrl = e.urlAfterRedirects;
    });
  }

  isActive(path: string, exact = false): boolean {
    if (exact) return this.currentUrl === path;
    return this.currentUrl.startsWith(path);
  }

  toggleMobileMenu() {
    this.mobileOpen = !this.mobileOpen;
    if (this.mobileOpen) this.navVisible = true;
  }

  closeMobileMenu() {
    this.mobileOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.mobileOpen) return;
    const target = event.target as HTMLElement;
    const clickedInsideMenu = this.mobileMenu?.nativeElement.contains(target);
    const clickedHamburger = target.closest('.hamburger');
    if (!clickedInsideMenu && !clickedHamburger) this.closeMobileMenu();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const st = window.pageYOffset || document.documentElement.scrollTop || 0;

    if (this.mobileOpen) {
      this.closeMobileMenu();
      this.navVisible = true;
      this.lastScrollTop = st;
      return;
    }

    if (st <= this.hideAfter) {
      this.navVisible = true;
      this.lastScrollTop = st;
      return;
    }

    const delta = st - this.lastScrollTop;
    if (Math.abs(delta) < this.showThreshold) return;
    this.navVisible = delta < 0;
    this.lastScrollTop = st <= 0 ? 0 : st;
  }
}
