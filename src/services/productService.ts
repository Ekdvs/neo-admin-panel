import axios from "axios";
import type { AxiosRequestConfig } from "axios";

import api from "@/lib/axios";
import type {
  ApiResponse,
  GetProductsParams,
  PresignedUpload,
  Product,
  ProductListData,
  ProductStatus,
} from "@/types/productType";

const BASE = "/api/product";
const UPLOAD_CONCURRENCY = 3;
type ApiRequestConfig = AxiosRequestConfig & { skipErrorToast?: boolean };

export interface CreateProductInput {
  sku: string;
  name: string;
  altName: string[];
  description: string | null;
  stock: number;
  status: ProductStatus;
  price: number;
  compareAtPrice: number | null;
  brand: string | null;
  model: string | null;
  media: File[];
}

export type CreateProgress = {
  phase: "uploading" | "saving";
  percent: number;
};

export const getProducts = async (
  params: GetProductsParams = {},
): Promise<ApiResponse<ProductListData>> => {
  const { page = 1, limit = 10 } = params;
  const res = await api.get<ApiResponse<ProductListData>>(BASE, {
    params: { page, limit },
  });
  return res.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const res = await api.get<ApiResponse<Product>>(`${BASE}/${id}`);
  console.log("getProductById res.data.data:", res.data.data);
  return res.data.data;
};

async function runWithConcurrency(
  tasks: (() => Promise<void>)[],
  limit: number,
) {
  let next = 0;

  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    async () => {
      while (next < tasks.length) {
        const index = next++;
        await tasks[index]();
      }
    },
  );

  await Promise.all(workers);
}

/**
 * 1. Ask backend for presigned URLs
 * 2. Upload files directly to S3 (with progress)
 * 3. Save product with the uploaded keys
 */
export const createProduct = async (
  product: CreateProductInput,
  onProgress?: (progress: CreateProgress) => void,
): Promise<ApiResponse<Product>> => {
  const { media: files, ...fields } = product;
  let uploadedKeys: { key: string }[] = [];

  if (files.length > 0) {
    let uploads: PresignedUpload[];

    try {
      const presign = await api.post<
        ApiResponse<{ uploads: PresignedUpload[] }>
      >(
        `${BASE}/upload-url`,
        {
          files: files.map((file) => ({
            contentType: file.type,
            size: file.size,
          })),
        },
        { skipErrorToast: true } as ApiRequestConfig,
      );
      uploads = presign.data.data.uploads;
    } catch (error) {
      if (axios.isAxiosError(error) && !error.response) {
        throw new Error(
          "Cannot reach backend (check NEXT_PUBLIC_API_URL and backend CORS)",
        );
      }
      throw error;
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const loaded = new Array<number>(files.length).fill(0);

    const report = () => {
      const done = loaded.reduce((a, b) => a + b, 0);
      onProgress?.({
        phase: "uploading",
        percent: Math.min(100, Math.round((done / totalBytes) * 100)),
      });
    };

    report();

    try {
      await runWithConcurrency(
        files.map((file, index) => async () => {
          await axios.put(uploads[index].uploadUrl, file, {
            headers: { "Content-Type": file.type },
            timeout: 0,
            onUploadProgress: (event) => {
              loaded[index] = event.loaded;
              report();
            },
          });
          loaded[index] = file.size;
          report();
        }),
        UPLOAD_CONCURRENCY,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response
            ? `S3 rejected upload (${error.response.status}). Check IAM permissions and bucket region.`
            : "S3 upload blocked. Add your frontend origin to the bucket CORS and check AWS_REGION.",
        );
      }
      throw error;
    }

    uploadedKeys = uploads.map((upload) => ({ key: upload.key }));
  }

  onProgress?.({ phase: "saving", percent: 100 });

  const response = await api.post<ApiResponse<Product>>(
    BASE,
    { ...fields, media: uploadedKeys },
    { skipErrorToast: true } as ApiRequestConfig,
  );

  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`${BASE}/${id}`, {
    skipErrorToast: true,
  } as ApiRequestConfig);
};


export interface UpdateProductInput {
  sku: string;
  name: string;
  altName: string[];
  description: string | null;
  stock: number;
  status: ProductStatus;
  price: number;
  compareAtPrice: number | null;
  brand: string | null;
  model: string | null;
  media: File[]; // newly selected files only
  existingMedia: { id: string }[]; // existing rows to keep (DB ids)
}

export const updateProduct = async (
  id: string,
  product: UpdateProductInput,
  onProgress?: (progress: CreateProgress) => void,
): Promise<ApiResponse<Product>> => {
  const { media: files, existingMedia, ...fields } = product;

  let newUploadedKeys: { key: string }[] = [];

  if (files.length > 0) {
    const presign = await api.post<ApiResponse<{ uploads: PresignedUpload[] }>>(
      `${BASE}/upload-url`,
      {
        files: files.map((file) => ({
          contentType: file.type,
          size: file.size,
        })),
      },
      { skipErrorToast: true } as ApiRequestConfig,
    );

    const uploads = presign.data.data.uploads;

    if (uploads.length !== files.length) {
      throw new Error("Failed to generate upload URLs for all files.");
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const loaded = new Array<number>(files.length).fill(0);

    const report = () => {
      const done = loaded.reduce((a, b) => a + b, 0);
      onProgress?.({
        phase: "uploading",
        percent: totalBytes
          ? Math.min(100, Math.round((done / totalBytes) * 100))
          : 100,
      });
    };

    report();

    try {
      await runWithConcurrency(
        files.map((file, index) => async () => {
          await axios.put(uploads[index].uploadUrl, file, {
            headers: { "Content-Type": file.type },
            timeout: 0,
            onUploadProgress: (event) => {
              loaded[index] = event.loaded;
              report();
            },
          });
          loaded[index] = file.size;
          report();
        }),
        UPLOAD_CONCURRENCY,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response
            ? `S3 rejected upload (${error.response.status}). Check IAM permissions and bucket region.`
            : "S3 upload blocked. Add your frontend origin to the bucket CORS and check AWS_REGION.",
        );
      }
      throw error;
    }

    newUploadedKeys = uploads.map((upload) => ({ key: upload.key }));
  }

  onProgress?.({ phase: "saving", percent: 100 });

  // Existing first (kept by id), then new uploads (by key) – order = sortOrder
  const finalMedia: ({ id: string } | { key: string })[] = [
    ...existingMedia.map(({ id }) => ({ id })),
    ...newUploadedKeys,
  ];

  const response = await api.put<ApiResponse<Product>>(
    `${BASE}/${id}`,
    { ...fields, media: finalMedia },
    { skipErrorToast: true } as ApiRequestConfig,
  );

  return response.data;
};