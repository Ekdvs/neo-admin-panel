"use client";

import * as React from "react";
import Image from "next/image";
import {
  MoreHorizontalIcon,
  EyeIcon,
  PencilIcon,
  CopyIcon,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  onDuplicate,
  onDelete,
}: AllProductsProps) {
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await onDelete?.(deleteTarget);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
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
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">All Products</h2>
        <p className="text-sm text-muted-foreground">
          Manage your salon products and inventory.
        </p>
      </div>

      {/* Table */}
      <div className="w-full overflow-hidden rounded-md border">
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
                            <DropdownMenuItem onClick={() => onView?.(product)}>
                              <EyeIcon className="mr-2 size-4" />
                              View
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => onEdit?.(product)}>
                              <PencilIcon className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => onDuplicate?.(product)}
                            >
                              <CopyIcon className="mr-2 size-4" />
                              Duplicate
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
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

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}