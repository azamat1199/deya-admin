import { apiClient } from "./client";
import type {
  CatalogItemBase,
  CatalogItemPayload,
  Category,
  Flavor,
  ProductFamily,
  ProductFamilyPayload,
  PatchProductFamilyRequest,
  ProductImage,
  ProductImagePayload,
  PatchProductImageRequest,
  Product,
  ProductPayload,
  PatchProductRequest,
  Weight,
  WeightPayload,
  PatchWeightRequest,
} from "../types/catalog";

/** CRUD calls for a simple catalog resource — all of them share the same
 * request/response shape, only the base path differs per resource. */
function createCatalogItemApi<T extends CatalogItemBase>(basePath: string) {
  return {
    list: () => apiClient.get<T[]>(basePath),
    get: (id: number) => apiClient.get<T>(`${basePath}${id}/`),
    create: (data: CatalogItemPayload) => apiClient.post<T>(basePath, data),
    update: (id: number, data: CatalogItemPayload) =>
      apiClient.put<T>(`${basePath}${id}/`, data),
    patch: (id: number, data: Partial<CatalogItemPayload>) =>
      apiClient.patch<T>(`${basePath}${id}/`, data),
    remove: (id: number) => apiClient.delete<void>(`${basePath}${id}/`),
  };
}

const categories = createCatalogItemApi<Category>(
  "/api/v1/admin/catalog/categories/",
);
const flavors = createCatalogItemApi<Flavor>("/api/v1/admin/catalog/flavors/");

const PRODUCT_FAMILIES_URL = "/api/v1/admin/catalog/product-families/";
const PRODUCT_IMAGES_URL = "/api/v1/admin/catalog/product-images/";
const PRODUCTS_URL = "/api/v1/admin/catalog/products/";
const WEIGHTS_URL = "/api/v1/admin/catalog/weights/";

export const catalogApi = {
  getCategories: categories.list,
  getCategory: categories.get,
  createCategory: categories.create,
  updateCategory: categories.update,
  patchCategory: categories.patch,
  deleteCategory: categories.remove,

  getFlavors: flavors.list,
  getFlavor: flavors.get,
  createFlavor: flavors.create,
  updateFlavor: flavors.update,
  patchFlavor: flavors.patch,
  deleteFlavor: flavors.remove,

  getProductFamilies: () =>
    apiClient.get<ProductFamily[]>(PRODUCT_FAMILIES_URL),

  getProductFamily: (id: number) =>
    apiClient.get<ProductFamily>(`${PRODUCT_FAMILIES_URL}${id}/`),

  createProductFamily: (data: ProductFamilyPayload) =>
    apiClient.post<ProductFamily>(PRODUCT_FAMILIES_URL, data),

  updateProductFamily: (id: number, data: ProductFamilyPayload) =>
    apiClient.put<ProductFamily>(`${PRODUCT_FAMILIES_URL}${id}/`, data),

  patchProductFamily: (id: number, data: PatchProductFamilyRequest) =>
    apiClient.patch<ProductFamily>(`${PRODUCT_FAMILIES_URL}${id}/`, data),

  deleteProductFamily: (id: number) =>
    apiClient.delete<void>(`${PRODUCT_FAMILIES_URL}${id}/`),

  getProductImages: () => apiClient.get<ProductImage[]>(PRODUCT_IMAGES_URL),

  getProductImage: (id: number) =>
    apiClient.get<ProductImage>(`${PRODUCT_IMAGES_URL}${id}/`),

  createProductImage: (data: ProductImagePayload) =>
    apiClient.post<ProductImage>(PRODUCT_IMAGES_URL, data),

  updateProductImage: (id: number, data: ProductImagePayload) =>
    apiClient.put<ProductImage>(`${PRODUCT_IMAGES_URL}${id}/`, data),

  patchProductImage: (id: number, data: PatchProductImageRequest) =>
    apiClient.patch<ProductImage>(`${PRODUCT_IMAGES_URL}${id}/`, data),

  deleteProductImage: (id: number) =>
    apiClient.delete<void>(`${PRODUCT_IMAGES_URL}${id}/`),

  getProducts: () => apiClient.get<Product[]>(PRODUCTS_URL),

  getProduct: (id: number) => apiClient.get<Product>(`${PRODUCTS_URL}${id}/`),

  createProduct: (data: ProductPayload) =>
    apiClient.post<Product>(PRODUCTS_URL, data),

  updateProduct: (id: number, data: ProductPayload) =>
    apiClient.put<Product>(`${PRODUCTS_URL}${id}/`, data),

  patchProduct: (id: number, data: PatchProductRequest) =>
    apiClient.patch<Product>(`${PRODUCTS_URL}${id}/`, data),

  deleteProduct: (id: number) => apiClient.delete<void>(`${PRODUCTS_URL}${id}/`),

  getWeights: () => apiClient.get<Weight[]>(WEIGHTS_URL),

  getWeight: (id: number) => apiClient.get<Weight>(`${WEIGHTS_URL}${id}/`),

  createWeight: (data: WeightPayload) =>
    apiClient.post<Weight>(WEIGHTS_URL, data),

  updateWeight: (id: number, data: WeightPayload) =>
    apiClient.put<Weight>(`${WEIGHTS_URL}${id}/`, data),

  patchWeight: (id: number, data: PatchWeightRequest) =>
    apiClient.patch<Weight>(`${WEIGHTS_URL}${id}/`, data),

  deleteWeight: (id: number) => apiClient.delete<void>(`${WEIGHTS_URL}${id}/`),
};
