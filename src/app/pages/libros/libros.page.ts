import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonSearchbar,
  IonChip,
  IonLabel,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { BookService } from '../../services/book.service';
import { BookItem } from '../../models/book.model';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-libros',
  templateUrl: './libros.page.html',
  styleUrls: ['./libros.page.scss'],
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonSearchbar,
    IonChip,
    IonLabel,
    IonProgressBar,
  ],
})
export class LibrosPage implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly cdr = inject(ChangeDetectorRef);
  public readonly themeService = inject(ThemeService);

  // Selector de modo de vista: Showcase Cards (por defecto) o Tabla Clásica
  viewMode: 'cards' | 'table' = 'cards';

  // Estados de la vista
  books: BookItem[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  currentQuery: string = 'software engineering';

  // Estados y configuración de paginación requeridos por el cliente
  currentPage: number = 1;
  readonly pageSize: number = 8;
  totalItems: number = 0;

  /**
   * Métricas y KPIs del Dashboard Comercial
   */
  get totalStockValoradoVisible(): number {
    return this.books.reduce((acc, book) => acc + this.calcularStockValorado(book), 0);
  }

  get totalUnidadesStockVisible(): number {
    return this.books.reduce((acc, book) => acc + (book.stock ?? 0), 0);
  }

  get descuentoMedioVisible(): number {
    if (this.books.length === 0) return 0;
    const totalDesc = this.books.reduce((acc, book) => acc + (book.discountPercentage ?? 0), 0);
    return Math.round(totalDesc / this.books.length);
  }

  get volumenesIndexados(): number {
    return this.totalItems || this.books.length;
  }

  setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode = mode;
  }

  calcularPrecioConDescuento(book: BookItem): number {
    const p = book.price ?? 0;
    const d = book.discountPercentage ?? 0;
    return p - (p * d / 100);
  }

  getStockProgress(stock?: number): number {
    const val = (stock ?? 0) / 60;
    return Math.min(1, Math.max(0.08, val));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get startIndexDisplay(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndexDisplay(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  }

  // Temas sugeridos para filtrado rápido
  readonly filterTopics: string[] = [
    'Software Engineering',
    'Angular',
    'TypeScript',
    'Clean Code',
    'Artificial Intelligence',
    'Cybersecurity',
  ];

  // Fallback SVG data URI para portadas nulas o rotas
  readonly placeholderImage =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="180" viewBox="0 0 128 180" fill="%231e2130"><rect width="100%" height="100%" fill="%231a1d29"/><path d="M40 50h48M40 70h48M40 90h30" stroke="%234285f4" stroke-width="4" stroke-linecap="round"/><circle cx="64" cy="130" r="14" fill="%2334a853" opacity="0.4"/><text x="50%" y="160" text-anchor="middle" fill="%239aa0a6" font-family="sans-serif" font-size="10">Sin portada</text></svg>';

  ngOnInit(): void {
    this.cargarLibros(this.currentQuery, true);
  }

  /**
   * Ejecuta la petición al servicio con manejo reactivo de estados y paginación
   */
  cargarLibros(query: string = this.currentQuery, resetPage: boolean = false): void {
    if (resetPage) {
      this.currentPage = 1;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.currentQuery = query;
    this.cdr.markForCheck();

    const startIndex = (this.currentPage - 1) * this.pageSize;

    this.bookService.getBooks(query, startIndex, this.pageSize).subscribe({
      next: (response) => {
        this.books = response.items || [];
        this.totalItems = response.totalItems || this.books.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'Error al conectar con Google Books API.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Avanza a la siguiente página si está disponible
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages && !this.isLoading) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Retrocede a la página anterior si está disponible
   */
  prevPage(): void {
    if (this.currentPage > 1 && !this.isLoading) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Navega directamente a un número de página específico
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage && !this.isLoading) {
      this.currentPage = page;
      this.cargarLibros(this.currentQuery, false);
    }
  }

  /**
   * Reintenta la carga tras un fallo
   */
  reintentar(): void {
    this.cargarLibros(this.currentQuery, false);
  }

  /**
   * Búsqueda disparada desde el searchbar (reinicia la paginación a la página 1)
   */
  onSearch(event: CustomEvent): void {
    const value = (event.detail.value || '').trim();
    if (value && value !== this.currentQuery) {
      this.cargarLibros(value, true);
    } else if (!value) {
      this.cargarLibros('software engineering', true);
    }
  }

  /**
   * Selecciona una temática de los chips (reinicia la paginación a la página 1)
   */
  seleccionarFiltro(tema: string): void {
    if (this.currentQuery !== tema) {
      this.cargarLibros(tema, true);
    }
  }

  /**
   * Reemplaza imágenes caídas con el fallback SVG
   */
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && imgElement.src !== this.placeholderImage) {
      imgElement.src = this.placeholderImage;
    }
  }

  /**
   * Genera un array numérico para pintar estrellas de calificación
   */
  getStars(rating?: number): number[] {
    const score = Math.round(rating || 0);
    return Array.from({ length: 5 }, (_, i) => (i < score ? 1 : 0));
  }

  /**
   * Extrae el año o fecha formateada
   */
  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Fecha desc.';
    return dateStr.length >= 4 ? dateStr.substring(0, 4) : dateStr;
  }

  /**
   * Implementa la fórmula de negocio del cliente para calcular el stock valorado:
   * Stock Valorado = (unidades * precio) - descuento aplicable
   * donde descuento aplicable = unidades * precio * (descuento / 100)
   */
  calcularStockValorado(book: BookItem): number {
    const unidades = book.stock ?? 0;
    const precioUnitario = book.price ?? 0;
    const porcentajeDescuento = book.discountPercentage ?? 0;

    const baseBruta = unidades * precioUnitario;
    const descuentoAplicable = baseBruta * (porcentajeDescuento / 100);

    return baseBruta - descuentoAplicable;
  }
}
