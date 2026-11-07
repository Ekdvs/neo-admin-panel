"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import AllProducts from "@/components/AllProducts";
import { deleteProduct, getProducts } from "@/services/productService";
import { Pagination, Product } from "@/types/productType";

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(searchParams.get("limit")) || 10);

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProducts({ page, limit });
      console.log("Fetched products:", data.data);
      toast.success(data.message); // Log the fetched data for debugging
      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error.response as { data?: { message?: string } })?.data?.message
          : undefined;
      toast.error(message || "Failed to fetch products");
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProducts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchProducts]);

  const handlePageChange = (newPage: number) => {
    router.push(`/dashboard/products?page=${newPage}&limit=${limit}`);
  };

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      toast.success("Product deleted");

      // if last item on page removed, go back one page
      if (products.length === 1 && page > 1) {
        handlePageChange(page - 1);
      } else {
        fetchProducts();
      }
    } catch {
      /* error toast handled by axios interceptor */
    }
  };

  return (
    <div className="flex h-full w-full flex-col p-4">
      <AllProducts
        products={products}
        pagination={pagination}
        loading={loading}
        limit={limit}
        onPageChange={handlePageChange}
        onView={(p) => router.push(`/dashboard/products/${p.id}`)}
        onEdit={(p) => router.push(`/dashboard/products/${p.id}/edit`)}
        onDuplicate={(p) =>
          router.push(`/dashboard/products/new?duplicate=${p.id}`)
        }
        onDelete={handleDelete}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}