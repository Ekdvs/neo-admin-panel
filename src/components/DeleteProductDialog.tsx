"use client";

import * as React from "react";
import { Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types/productType";

type DeleteProductDialogProps = {
  product: Product | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function DeleteProductDialog({
  product,
  deleting,
  onClose,
  onConfirm,
}: DeleteProductDialogProps) {
  return (
    <Dialog
      open={!!product}
      onOpenChange={(open) => {
        if (!open && !deleting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DeleteProductForm
          key={product?.id ?? "closed"}
          product={product}
          deleting={deleting}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </DialogContent>
    </Dialog>
  );
}

function DeleteProductForm({
  product,
  deleting,
  onClose,
  onConfirm,
}: DeleteProductDialogProps) {
  const [confirmText, setConfirmText] = React.useState("");
  const canDelete = !!product && confirmText === product.sku && !deleting;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canDelete) onConfirm();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert className="size-5" />
            </div>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              You are about to delete <strong>{product?.name}</strong>. This
              product will no longer be available in your store.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm-sku">
              Type{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {product?.sku}
              </code>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-sku"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={product?.sku}
              autoComplete="off"
              disabled={deleting}
              aria-invalid={confirmText.length > 0 && !canDelete && !deleting}
            />
            <p className="text-xs text-muted-foreground">
              The SKU is case-sensitive and must match exactly.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!canDelete}
              className="gap-2 cursor-pointer"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete Product"
              )}
            </Button>
          </DialogFooter>
    </form>
  );
}