export type MediaType = "IMAGE" | "VIDEO";
export type ProductStatus = "ACTIVE" | "INACTIVE" | "DELETED";

export interface ProductMedia {
  id: string;
  productId: string;
  url: string;
  type: MediaType;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  altName: string[];
  description: string | null;
  stock: number;
  status: ProductStatus;
  price: string | number;
  compareAtPrice: string | number | null;
  brand: string | null;
  model: string | null;
  createdAt: string;
  updatedAt: string;
  media: ProductMedia[];
}

export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalProducts: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductListData {
  products: Product[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
}