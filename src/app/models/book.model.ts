export interface GoogleBooksResponse {
  kind: string;
  totalItems: number;
  items?: BookItem[];
}

export interface BookDimensions {
  width: number;  // Ancho en cm
  height: number; // Alto en cm
}

export interface BookItem {
  id: string;
  volumeInfo: BookVolumeInfo;
  saleInfo?: any;

  // Métricas de negocio y dimensiones físicas requeridas por el cliente
  dimensions?: BookDimensions;
  stock?: number;
  price?: number;
  discountPercentage?: number;
}

export interface BookVolumeInfo {
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  language?: string;
  infoLink?: string;
}
