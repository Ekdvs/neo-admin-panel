"use client";

import * as React from "react";
import Image from "next/image";
import {
  MoreHorizontalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  Package,
  Loader2,
} from "lucide-react";

import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import DeleteProductDialog from "@/components/DeleteProductDialog";

import { Pagination, Product } from "@/types/productType";

type AllProductsProps = {
  products: Product[];
  pagination: Pagination | null;
  loading?: boolean;
  limit?: number;
  onPageChange: (page: number) => void;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  // Throw from this function to keep the delete dialog open.
  // The parent is responsible for showing the error toast.
  onDelete?: (product: Product) => void | Promise<void>;
};

const currencyFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 2,
});

const formatPrice = (value: string | number) =>
  currencyFormatter.format(Number(value));

/** Builds [1, "...", 4, 5, 6, "...", 10] style page list */
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");

  pages.push(total);
  return pages;
}

export default function AllProducts({
  products,
  pagination,
  loading = false,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: AllProductsProps) {
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await onDelete?.(deleteTarget);
      // Success: close the dialog
      setDeleteTarget(null);
    } catch {
      // Failure: the parent already showed the backend error toast.
      // Keep the dialog open so the user can retry or cancel.
    } finally {
      setDeleting(false);
    }
  };

  const goTo = (e: React.MouseEvent, page: number) => {
    e.preventDefault();
    if (!pagination) return;
    if (page < 1 || page > pagination.totalPages) return;
    if (page === pagination.currentPage) return;
    onPageChange(page);
  };

  return (
    <div className="w-full space-y-4">
      {/* Table */}
      <div className="w-full overflow-hidden rounded-md border p-1">
        <div className="relative w-full overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <Table>
            <TableCaption>
              {pagination
                ? `Showing ${products.length} of ${pagination.totalProducts} products.`
                : `Showing ${products.length} products.`}
            </TableCaption>

            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[90px]">Image</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="min-w-[200px]">Product Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Compare Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    {loading ? "Loading products..." : "No products found."}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const productImage = product.media?.find(
                    (item) => item.type === "IMAGE"
                  );

                  return (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer odd:bg-gray-50 even:bg-white dark:odd:bg-gray-900 dark:even:bg-gray-950 hover:bg-muted"
                      onClick={() => onView?.(product)}
                    >
                      {/* Image */}
                      <TableCell>
                        <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
                          {productImage ? (
                            <Image
                              src={productImage.url}
                              alt={product.name}
                              fill
                              sizes="48px"
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <Package className="size-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="font-mono text-xs">
                        {product.sku}
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{product.name}</span>
                          <span className="max-w-[220px] truncate text-xs text-muted-foreground">
                            {product.description || "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Brand */}
                      <TableCell>{product.brand || "—"}</TableCell>

                      {/* Model */}
                      <TableCell>{product.model || "—"}</TableCell>

                      {/* Stock */}
                      <TableCell className="text-center">
                        {product.stock === 0 ? (
                          <Badge variant="destructive">Out of stock</Badge>
                        ) : product.stock <= 10 ? (
                          <Badge variant="secondary">Low: {product.stock}</Badge>
                        ) : (
                          <span className="font-medium">{product.stock}</span>
                        )}
                      </TableCell>

                      {/* Price */}
                      <TableCell className="text-right font-medium">
                        {formatPrice(product.price)}
                      </TableCell>

                      {/* Compare price */}
                      <TableCell className="text-right">
                        {product.compareAtPrice !== null ? (
                          <span className="text-muted-foreground line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={
                            product.status === "ACTIVE" ? "default" : "secondary"
                          }
                        >
                          {product.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                              >
                                <MoreHorizontalIcon />
                                <span className="sr-only">
                                  Open product actions
                                </span>
                              </Button>
                            }
                          />

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => onView?.(product)}>
                              <EyeIcon className="mr-2 size-4 cursor-pointer" />
                              View
                            </DropdownMenuItem>

                            <DropdownMenuItem className="cursor-pointer"  onClick={() => onEdit?.(product)}>
                              <PencilIcon className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem className="cursor-pointer" 
                              variant="destructive"
                              onClick={() => setDeleteTarget(product)}
                            >
                              <Trash2Icon className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t py-3">
            <PaginationRoot>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={!pagination.hasPreviousPage}
                    className={
                      !pagination.hasPreviousPage
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={(e) => goTo(e, pagination.currentPage - 1)}
                  />
                </PaginationItem>

                {getPageNumbers(
                  pagination.currentPage,
                  pagination.totalPages
                ).map((p, i) =>
                  p === "..." ? (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === pagination.currentPage}
                        onClick={(e) => goTo(e, p)}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={!pagination.hasNextPage}
                    className={
                      !pagination.hasNextPage
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={(e) => goTo(e, pagination.currentPage + 1)}
                  />
                </PaginationItem>
              </PaginationContent>
            </PaginationRoot>
          </div>
        )}
      </div>

      {/* Delete confirmation (user must type the SKU) */}
      <DeleteProductDialog
        product={deleteTarget}
        deleting={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}