import api from "@/lib/axios";
import {
  ApiResponse,
  GetProductsParams,
  Product,
  ProductListData,
} from "@/types/productType";

const BASE = "/api/product";

export const getProducts = async (
  params: GetProductsParams = {}
): Promise<ApiResponse<ProductListData>> => {
  const { page = 1, limit = 10 } = params;
  const res = await api.get<ApiResponse<ProductListData>>(BASE, {
    params: { page, limit },
  });
  console.log("API Response:", res.data); // Log the entire response for debugging
  return res.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const res = await api.get<ApiResponse<Product>>(`${BASE}/${id}`);
  return res.data.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`${BASE}/${id}`);
};