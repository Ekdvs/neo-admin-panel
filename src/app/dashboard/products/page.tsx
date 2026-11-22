"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";

import AllProducts from "@/components/AllProducts";
import { deleteProduct, getProducts } from "@/services/productService";
import { Pagination, Product } from "@/types/productType";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Package, RefreshCw, ShoppingBag } from "lucide-react";

// Reads the `message` sent by the backend (errorResponse)
const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Cannot reach the server. Check your connection.";
    }
    return error.response.data?.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(searchParams.get("limit")) || 10);

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getProducts({ page, limit });

      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to fetch products"));

      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProducts();
  }, [fetchProducts]);

  // Pagination
  const handlePageChange = (newPage: number) => {
    router.push(`/dashboard/products?page=${newPage}&limit=${limit}`);
  };

  // Delete product
  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id);

      toast.success(`"${product.name}" deleted successfully`);

      // Deleted the last item on this page → go to the previous page
      if (products.length === 1 && page > 1) {
        handlePageChange(page - 1);
      } else {
        await fetchProducts();
      }
    } catch (error) {
      console.error("Delete product error:", error);

      // Show the exact message sent by the backend
      toast.error(getErrorMessage(error, "Failed to delete product"), {
        duration: 5000,
      });

      // Product is already gone (404/410): refresh the list and let the
      // dialog close instead of leaving the user stuck on it.
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 404 || error.response?.status === 410)
      ) {
        await fetchProducts();
        return;
      }

      // Any other error: rethrow so the dialog stays open
      throw error;
    }
  };

  // Refresh
  const handleRefresh = () => {
    void fetchProducts();
  };

  return (
    <div className="flex min-h-full w-full flex-col gap-3.5 p-2 sm:p-6">
      {/* Page Header */}
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-5 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Heading */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShoppingBag className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Products
                </h1>

                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  Manage your products, inventory, pricing and product
                  information from one place.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button className="gap-2">
                <Link href="/dashboard/products/add-product">Add Product</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Total Products */}
        <Card className="border shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Total Products
              </p>

              <p className="text-3xl font-bold tracking-tight">
                {pagination?.totalProducts ?? 0}
              </p>

              <p className="text-xs text-muted-foreground">
                Available product pages
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Package className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Current Page */}
        <Card className="border shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Current Page
              </p>

              <p className="text-3xl font-bold tracking-tight">
                {pagination?.currentPage ?? 0}
                <span className="text-lg font-medium text-muted-foreground">
                  {" "}
                  / {pagination?.totalPages ?? 0}
                </span>
              </p>

              <p className="text-xs text-muted-foreground">
                Showing {limit} products per page
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="min-w-0 border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b px-5 py-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">All Products</CardTitle>

            <p className="text-sm text-muted-foreground">
              View and manage your product collection.
            </p>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 p-0">
          <AllProducts
            products={products}
            pagination={pagination}
            loading={loading}
            limit={limit}
            onPageChange={handlePageChange}
            onView={(product) =>
              router.push(`/dashboard/products/${product.id}`)
            }
            onEdit={(product) =>
              router.push(`/dashboard/products/${product.id}/edit`)
            }
            onDuplicate={(product) =>
              router.push(`/dashboard/products/new?duplicate=${product.id}`)
            }
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}