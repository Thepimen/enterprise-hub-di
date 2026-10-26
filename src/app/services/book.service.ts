import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { GoogleBooksResponse, BookItem } from '../models/book.model';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://www.googleapis.com/books/v1/volumes';

  /**
   * Catálogo de respaldo exhaustivo por temáticas para garantizar que la app
   * siempre sea interactiva incluso ante la saturación de cuota de Google (HTTP 429).
   */
  private readonly curatedCatalog: Record<string, BookItem[]> = {
    'software engineering': [
      {
        id: 'se-01',
        volumeInfo: {
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          authors: ['Robert C. Martin'],
          publisher: 'Prentice Hall',
          publishedDate: '2008-08-01',
          description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
          pageCount: 464,
          categories: ['Computers / Software Development'],
          averageRating: 4.8,
          ratingsCount: 4120,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=_i6bDeoCQzsC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=_i6bDeoCQzsC',
        },
      },
      {
        id: 'se-02',
        volumeInfo: {
          title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
          authors: ['Erich Gamma', 'Richard Helm', 'Ralph Johnson', 'John Vlissides'],
          publisher: 'Addison-Wesley Professional',
          publishedDate: '1994-10-21',
          description: 'Four top-notch designers present a catalog of simple and succinct solutions to commonly occurring software design problems.',
          pageCount: 395,
          categories: ['Computers / Software Engineering'],
          averageRating: 4.9,
          ratingsCount: 3100,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=6oSquarep4dcC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=6oSquarep4dcC',
        },
      },
      {
        id: 'se-03',
        volumeInfo: {
          title: 'The Pragmatic Programmer: Your Journey to Mastery',
          authors: ['David Thomas', 'Andrew Hunt'],
          publisher: 'Addison-Wesley Professional',
          publishedDate: '2019-09-13',
          description: 'A timeless classic exploring modern best practices for developers: from personal responsibility and career development to architectural techniques.',
          pageCount: 352,
          categories: ['Computers / Programming'],
          averageRating: 4.7,
          ratingsCount: 2280,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=bYWNDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=bYWNDwAAQBAJ',
        },
      },
      {
        id: 'se-04',
        volumeInfo: {
          title: 'Designing Data-Intensive Applications',
          authors: ['Martin Kleppmann'],
          publisher: "O'Reilly Media",
          publishedDate: '2017-03-16',
          description: 'The definitive guide to the architecture of distributed systems, storage engines, streaming pipelines, and consensus algorithms.',
          pageCount: 616,
          categories: ['Computers / Architecture'],
          averageRating: 4.9,
          ratingsCount: 5120,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=9M_CDgAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=9M_CDgAAQBAJ',
        },
      },
      {
        id: 'se-05',
        volumeInfo: {
          title: 'Building Microservices: Designing Fine-Grained Systems',
          authors: ['Sam Newman'],
          publisher: "O'Reilly Media",
          publishedDate: '2021-08-11',
          description: 'Takes a holistic view of the topics system architects and developers must consider when building, managing, and scaling microservices.',
          pageCount: 612,
          categories: ['Computers / Distributed Systems'],
          averageRating: 4.6,
          ratingsCount: 1140,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=3R9AEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=3R9AEAAAQBAJ',
        },
      },
      {
        id: 'se-06',
        volumeInfo: {
          title: 'Software Engineering at Google: Lessons Learned from Programming Over Time',
          authors: ['Titus Winters', 'Tom Manshreck', 'Hyrum Wright'],
          publisher: "O'Reilly Media",
          publishedDate: '2020-02-28',
          description: 'How does Google write and maintain code? Software Engineering at Google covers culture, process, and tools that make code sustainable.',
          pageCount: 598,
          categories: ['Computers / Engineering Process'],
          averageRating: 4.7,
          ratingsCount: 1650,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=w5bTDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=w5bTDwAAQBAJ',
        },
      },
    ],
    angular: [
      {
        id: 'ng-01',
        volumeInfo: {
          title: 'Angular in Action',
          authors: ['Jeremy Wilken'],
          publisher: 'Manning Publications',
          publishedDate: '2018-03-27',
          description: 'Teaches you how to build professional, production-ready web applications using modern Angular patterns and TypeScript.',
          pageCount: 320,
          categories: ['Computers / Web Development'],
          averageRating: 4.5,
          ratingsCount: 840,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=KIdQDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=KIdQDwAAQBAJ',
        },
      },
      {
        id: 'ng-02',
        volumeInfo: {
          title: 'Enterprise Angular: Architecture and Best Practices',
          authors: ['Manfred Steyer'],
          publisher: 'Angular Academy',
          publishedDate: '2021-04-10',
          description: 'In-depth guide for enterprise-scale architectures, standalone components, monorepos, and reactive state management.',
          pageCount: 280,
          categories: ['Computers / Frontend Architecture'],
          averageRating: 4.8,
          ratingsCount: 620,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=0Xn8DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=0Xn8DwAAQBAJ',
        },
      },
      {
        id: 'ng-03',
        volumeInfo: {
          title: 'Pro Angular: Comprehensive Guide to Front-End Development',
          authors: ['Adam Freeman'],
          publisher: 'Apress',
          publishedDate: '2022-01-15',
          description: 'Best-selling guide to Angular detailing services, routing, forms, signals, and RxJS integrations for robust web apps.',
          pageCount: 780,
          categories: ['Computers / JavaScript Frameworks'],
          averageRating: 4.6,
          ratingsCount: 950,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=g_n_DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=g_n_DwAAQBAJ',
        },
      },
    ],
    typescript: [
      {
        id: 'ts-01',
        volumeInfo: {
          title: 'Programming TypeScript: Making Your JavaScript Applications Scale',
          authors: ['Boris Cherny'],
          publisher: "O'Reilly Media",
          publishedDate: '2019-04-25',
          description: 'Any programmer with JavaScript experience will learn how to write scalable, bug-free applications with TypeScript\'s advanced type system.',
          pageCount: 324,
          categories: ['Computers / TypeScript'],
          averageRating: 4.7,
          ratingsCount: 1410,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=4P2QDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=4P2QDwAAQBAJ',
        },
      },
      {
        id: 'ts-02',
        volumeInfo: {
          title: 'Effective TypeScript: 62 Specific Ways to Improve Your TypeScript',
          authors: ['Dan Vanderkam'],
          publisher: "O'Reilly Media",
          publishedDate: '2019-10-17',
          description: 'Guides you through 62 specific ways to write idiomatic TypeScript, master type inference, and avoid common pitfalls.',
          pageCount: 284,
          categories: ['Computers / Software Engineering'],
          averageRating: 4.9,
          ratingsCount: 1870,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=Z_u_DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=Z_u_DwAAQBAJ',
        },
      },
    ],
    'clean code': [
      {
        id: 'cc-01',
        volumeInfo: {
          title: 'The Clean Coder: A Code of Conduct for Professional Programmers',
          authors: ['Robert C. Martin'],
          publisher: 'Prentice Hall',
          publishedDate: '2011-05-13',
          description: 'Practical advice about craftsmanship, communication, estimation, and professional conduct for software engineers.',
          pageCount: 256,
          categories: ['Computers / Agile & Craftsmanship'],
          averageRating: 4.6,
          ratingsCount: 2900,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=K0qNDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=K0qNDwAAQBAJ',
        },
      },
      {
        id: 'cc-02',
        volumeInfo: {
          title: 'Clean Architecture: A Craftsman\'s Guide to Software Structure',
          authors: ['Robert C. Martin'],
          publisher: 'Prentice Hall',
          publishedDate: '2017-09-20',
          description: 'Universal rules of software architecture to dramatically improve developer productivity and system longevity over time.',
          pageCount: 432,
          categories: ['Computers / Software Architecture'],
          averageRating: 4.7,
          ratingsCount: 3500,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=b6e_DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=b6e_DwAAQBAJ',
        },
      },
    ],
    'artificial intelligence': [
      {
        id: 'ai-01',
        volumeInfo: {
          title: 'Artificial Intelligence: A Modern Approach (4th Edition)',
          authors: ['Stuart Russell', 'Peter Norvig'],
          publisher: 'Pearson',
          publishedDate: '2020-04-28',
          description: 'The standard and most comprehensive worldwide reference text in artificial intelligence, search, probabilistic reasoning, and machine learning.',
          pageCount: 1152,
          categories: ['Computers / Artificial Intelligence'],
          averageRating: 4.8,
          ratingsCount: 3890,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=n_i-DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=n_i-DwAAQBAJ',
        },
      },
      {
        id: 'ai-02',
        volumeInfo: {
          title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
          authors: ['Aurélien Géron'],
          publisher: "O'Reilly Media",
          publishedDate: '2022-10-04',
          description: 'Through a series of recent breakthroughs, deep learning has boosted the entire field of machine learning into industrial applications.',
          pageCount: 856,
          categories: ['Computers / Machine Learning'],
          averageRating: 4.9,
          ratingsCount: 4420,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=7h_PDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=7h_PDwAAQBAJ',
        },
      },
    ],
    cybersecurity: [
      {
        id: 'sec-01',
        volumeInfo: {
          title: 'The Web Application Hacker\'s Handbook: Finding and Exploiting Security Flaws',
          authors: ['Dafydd Stuttard', 'Marcus Pinto'],
          publisher: 'Wiley',
          publishedDate: '2011-09-27',
          description: 'The definitive guide to finding and exploiting security flaws in modern web applications and API protocols.',
          pageCount: 912,
          categories: ['Computers / Security'],
          averageRating: 4.7,
          ratingsCount: 2310,
          imageLinks: {
            thumbnail: 'https://books.google.com/books/content?id=z0q_DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          },
          language: 'en',
          infoLink: 'https://books.google.es/books?id=z0q_DwAAQBAJ',
        },
      },
    ],
  };

  /**
   * Obtiene la colección paginada de libros desde Google Books REST API.
   * Realiza la llamada HTTP real y, en caso de cuota excedida pública (HTTP 429),
   * rescata de forma transparente la petición devolviendo la página de datos de contingencia tipados.
   */
  getBooks(
    query: string = 'software engineering',
    startIndex: number = 0,
    maxResults: number = 10
  ): Observable<GoogleBooksResponse> {
    const sanitizedQuery = query.trim() || 'software engineering';
    const params = {
      q: sanitizedQuery,
      startIndex: startIndex.toString(),
      maxResults: maxResults.toString(),
      orderBy: 'relevance',
    };

    return this.http.get<GoogleBooksResponse>(this.apiUrl, { params }).pipe(
      map((response) => {
        if (response?.items && response.items.length > 0) {
          response.items = response.items.map((item, idx) => {
            if (item.volumeInfo?.imageLinks) {
              const { thumbnail, smallThumbnail } = item.volumeInfo.imageLinks;
              item.volumeInfo.imageLinks = {
                thumbnail: thumbnail ? thumbnail.replace(/^http:\/\//i, 'https://') : undefined,
                smallThumbnail: smallThumbnail ? smallThumbnail.replace(/^http:\/\//i, 'https://') : undefined,
              };
            }
            return this.enrichBookItem(item, startIndex + idx);
          });
          return response;
        }

        // Si la respuesta vino vacía pero con 200, retornamos la respuesta normal
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        console.warn('Google Books API retornó error (' + error.status + '). Activando contingencia con datos técnicos:', error.message);
        return of(this.getCuratedResponse(sanitizedQuery, startIndex, maxResults));
      })
    );
  }

  /**
   * Enriquece un BookItem con dimensiones físicas consistentes (ancho × alto en cm)
   * y métricas de negocio realistas (stock, precio unitario y descuento porcentual).
   */
  private enrichBookItem(item: BookItem, index: number = 0): BookItem {
    // Si ya posee las métricas asignadas, se preservan
    if (item.dimensions && item.stock !== undefined && item.price !== undefined && item.discountPercentage !== undefined) {
      return item;
    }

    // Generador determinista basado en caracteres del ID y posición
    const seed = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;

    // Dimensiones estándar de libros técnicos (ej. 15 cm × 23 cm con variaciones sutiles)
    const width = 15 + (seed % 3);   // 15, 16 o 17 cm
    const height = 23 + (seed % 4);  // 23, 24, 25 o 26 cm

    // Stock de inventario entre 10 y 60 unidades
    const stock = 10 + (seed % 51);

    // Precios unitarios de mercado editorial técnico (€)
    const priceTable = [24.95, 29.90, 34.50, 39.95, 42.50, 48.00, 52.95, 59.90];
    const price = priceTable[seed % priceTable.length];

    // Descuentos comerciales aplicables: 0%, 5%, 10%, 15%, 20%
    const discountTable = [0, 5, 10, 15, 20];
    const discountPercentage = discountTable[seed % discountTable.length];

    item.dimensions = { width, height };
    item.stock = stock;
    item.price = price;
    item.discountPercentage = discountPercentage;

    return item;
  }

  /**
   * Genera una respuesta GoogleBooksResponse tipada y paginada para la consulta especificada
   */
  getCuratedResponse(query: string, startIndex: number = 0, maxResults: number = 10): GoogleBooksResponse {
    const normalized = query.toLowerCase();
    let matchedItems: BookItem[] = [];

    for (const key of Object.keys(this.curatedCatalog)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        matchedItems = this.curatedCatalog[key];
        break;
      }
    }

    // Consolidamos un catálogo general para permitir paginación fluida
    const allCatalogPool: BookItem[] = [];
    Object.values(this.curatedCatalog).forEach((categoryBooks) => {
      categoryBooks.forEach((b) => {
        if (!allCatalogPool.some((item) => item.id === b.id)) {
          allCatalogPool.push(b);
        }
      });
    });

    const sourceItems = matchedItems.length >= maxResults ? matchedItems : allCatalogPool;
    const totalCount = sourceItems.length;

    // Aseguramos que todos los ítems de contingencia posean dimensiones y datos económicos completos
    const allEnrichedItems = sourceItems.map((item, idx) => this.enrichBookItem(item, idx));

    // Extraemos la rebanada de la página solicitada
    const pagedItems = allEnrichedItems.slice(startIndex, startIndex + maxResults);

    return {
      kind: 'books#volumes',
      totalItems: totalCount,
      items: pagedItems,
    };
  }

  /**
   * Método público de fallback para pruebas offline explícitas
   */
  getFallbackBooks(startIndex: number = 0, maxResults: number = 10): Observable<GoogleBooksResponse> {
    return of(this.getCuratedResponse('software engineering', startIndex, maxResults));
  }
}
