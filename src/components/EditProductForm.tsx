
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  CheckCircle2,
  Loader2,
  Package,
  Wallet,
  ImagePlus,
  Trash2,
} from "lucide-react";

import {
  getProductById,
  updateProduct,
  type CreateProgress,
} from "@/services/productService";

import type { Product, ProductStatus } from "@/types/productType";

import MediaUploader, {
  type MediaItem,
} from "@/components/MediaUploader";

import { MAX_FILES } from "@/lib/product-media";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type FormValues = {
  sku: string;
  name: string;
  altName: string;
  description: string;
  brand: string;
  model: string;
  price: string;
  compareAtPrice: string;
  stock: string;
};

type ExistingMedia = {
  id?: string;
  key: string;
  url: string;
  type: "IMAGE" | "VIDEO";
};

type FieldErrors = Partial<
  Record<keyof FormValues, string>
>;

const INITIAL_VALUES: FormValues = {
  sku: "",
  name: "",
  altName: "",
  description: "",
  brand: "",
  model: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
};

const parseAltNames = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const EditProductForm = ({
  productId,
}: {
  productId: string;
}) => {
  const router = useRouter();

  const [values, setValues] =
    useState<FormValues>(INITIAL_VALUES);

  const [status, setStatus] =
    useState<ProductStatus>("ACTIVE");

  const [existingMedia, setExistingMedia] =
    useState<ExistingMedia[]>([]);

  const [newMedia, setNewMedia] =
    useState<MediaItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [progress, setProgress] =
    useState<CreateProgress | null>(null);

  const [errors, setErrors] =
    useState<FieldErrors>({});

  // Load product information.
  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      try {
        setFetching(true);

        const product: Product =
          await getProductById(productId);

        if (!active) return;

        setValues({
          sku: product.sku ?? "",
          name: product.name ?? "",
          altName: (product.altName ?? []).join(", "),
          description: product.description ?? "",
          brand: product.brand ?? "",
          model: product.model ?? "",
          price: String(product.price ?? ""),
          compareAtPrice:
            product.compareAtPrice != null
              ? String(product.compareAtPrice)
              : "",
          stock: String(product.stock ?? 0),
        });

        setStatus(product.status);

        // Existing media from the database.
        setExistingMedia(
          (product.media ?? []).map((item) => ({
            id: item.id,
            key: item.id,
            url: item.url,
            type: item.type,
          })),
        );
      } catch (error) {
        console.error("Load product error:", error);

        toast.error(
          axios.isAxiosError(error)
            ? error.response?.data?.message ||
                "Failed to load product"
            : "Failed to load product",
        );
      } finally {
        if (active) setFetching(false);
      }
    };

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  const setField =
    (key: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({
        ...prev,
        [key]: event.target.value,
      }));

      setErrors((prev) => ({
        ...prev,
        [key]: undefined,
      }));
    };

  // Remove an existing database media item.
  const removeExistingMedia = (key: string) => {
    setExistingMedia((prev) =>
      prev.filter((item) => item.key !== key),
    );
  };

  // Validate product fields.
  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};

    const price = Number(values.price);
    const stock = Number(values.stock);
    const altNames = parseAltNames(values.altName);

    if (!values.sku.trim()) {
      nextErrors.sku = "SKU is required";
    }

    if (values.name.trim().length < 3) {
      nextErrors.name =
        "Product name must be at least 3 characters";
    }

    if (altNames.length > 10) {
      nextErrors.altName =
        "Maximum 10 alternative names";
    }

    if (values.description.length > 1000) {
      nextErrors.description = "Maximum 1000 characters";
    }

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 1_000_000
    ) {
      nextErrors.price = "Enter a valid selling price";
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0 ||
      stock > 1_000_000
    ) {
      nextErrors.stock = "Enter a valid stock quantity";
    }

    if (values.compareAtPrice.trim()) {
      const compare = Number(values.compareAtPrice);

      if (!Number.isFinite(compare) || compare <= price) {
        nextErrors.compareAtPrice =
          "Must be greater than selling price";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // Submit product update.
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading || fetching) return;

    if (!validate()) {
      toast.error("Please check the form fields");
      return;
    }

    if (
      existingMedia.length + newMedia.length >
      MAX_FILES
    ) {
      toast.error(`Maximum ${MAX_FILES} media files allowed`);
      return;
    }

    setLoading(true);
    setProgress({
      phase: "uploading",
      percent: 0,
    });

    try {
      const response = await updateProduct(
        productId,
        {
          sku: values.sku.trim(),
          name: values.name.trim(),
          altName: parseAltNames(values.altName),
          description: values.description.trim() || null,
          brand: values.brand.trim() || null,
          model: values.model.trim() || null,
          price: Number(values.price),
          compareAtPrice: values.compareAtPrice.trim()
            ? Number(values.compareAtPrice)
            : null,
          stock: Number(values.stock),
          status:
            Number(values.stock) === 0
              ? "INACTIVE"
              : status,

          // Only newly selected files are uploaded.
          media: newMedia.map((item) => item.file),

          // Preserve existing media.
          existingMedia: existingMedia.map((item) => ({
            key: item.key,
          })),
        },
        setProgress,
      );

      if (!response.success) {
        throw new Error(
          response.message || "Product update failed",
        );
      }

      toast.success(
        response.message || "Product updated successfully!",
      );

      router.push("/dashboard/products");
      router.refresh();
    } catch (error) {
      console.error("Update product error:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Failed to update product";

      toast.error(message, {
        duration: 5000,
      });

      setLoading(false);
      setProgress(null);
    }
  };

  const progressLabel =
    progress?.phase === "uploading"
      ? `Uploading new media... ${progress.percent}%`
      : "Saving product changes...";

  if (fetching) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Loading product information...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      {/* BASIC INFORMATION */}

      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Package className="size-6 text-primary" />

            <div>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update product identification and details.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="grid grid-cols-1 gap-5 pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              value={values.sku}
              onChange={setField("sku")}
              disabled={loading}
            />
            {errors.sku && (
              <p className="text-xs text-destructive">
                {errors.sku}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={values.name}
              onChange={setField("name")}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="altName">Alternative Names</Label>
            <Input
              id="altName"
              value={values.altName}
              onChange={setField("altName")}
              placeholder="Name 1, Name 2, Name 3"
              disabled={loading}
            />
            {errors.altName && (
              <p className="text-xs text-destructive">
                {errors.altName}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={setField("description")}
              maxLength={1000}
              rows={5}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {values.description.length}/1000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={values.brand}
              onChange={setField("brand")}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={values.model}
              onChange={setField("model")}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* PRICING AND INVENTORY */}

      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Wallet className="size-6 text-primary" />

            <div>
              <CardTitle>Pricing & Inventory</CardTitle>
              <CardDescription>
                Update selling price and stock availability.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="grid grid-cols-1 gap-5 pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Selling Price *</Label>
            <Input
              id="price"
              type="number"
              min="0.01"
              step="0.01"
              value={values.price}
              onChange={setField("price")}
              disabled={loading}
            />
            {errors.price && (
              <p className="text-xs text-destructive">
                {errors.price}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="compareAtPrice">
              Compare-at Price
            </Label>
            <Input
              id="compareAtPrice"
              type="number"
              min="0"
              step="0.01"
              value={values.compareAtPrice}
              onChange={setField("compareAtPrice")}
              disabled={loading}
            />
            {errors.compareAtPrice && (
              <p className="text-xs text-destructive">
                {errors.compareAtPrice}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock Quantity *</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              step="1"
              value={values.stock}
              onChange={setField("stock")}
              disabled={loading}
            />
            {errors.stock && (
              <p className="text-xs text-destructive">
                {errors.stock}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Product Status</Label>

            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as ProductStatus)
              }
              disabled={loading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* EXISTING MEDIA */}

      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ImagePlus className="size-6 text-primary" />

            <div>
              <CardTitle>Existing Product Media</CardTitle>
              <CardDescription>
                Remove media you no longer need.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {existingMedia.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No existing media.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {existingMedia.map((item) => (
                <div
                  key={item.key}
                  className="relative overflow-hidden rounded-lg border"
                >
                  {item.type === "VIDEO" ? (
                    <video
                      src={item.url}
                      controls
                      className="h-36 w-full bg-black object-cover"
                    />
                  ) : (
                    <div className="relative h-36 w-full">
                      <Image
                        src={item.url}
                        alt="Product media"
                        fill
                        unoptimized
                        sizes="200px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2">
                    <Badge variant="secondary">
                      {item.type}
                    </Badge>

                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="size-8"
                      disabled={loading}
                      onClick={() =>
                        removeExistingMedia(item.key)
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NEW MEDIA */}

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Add New Media</CardTitle>
          <CardDescription>
            Upload additional images and videos.
          </CardDescription>

          <Badge variant="secondary" className="w-fit">
            {existingMedia.length + newMedia.length} / {MAX_FILES} files
          </Badge>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <MediaUploader
            items={newMedia}
            onChange={setNewMedia}
            disabled={
              loading ||
              existingMedia.length + newMedia.length >= MAX_FILES
            }
          />
        </CardContent>
      </Card>

      {/* UPLOAD PROGRESS */}

      {loading && progress && (
        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-sm font-medium">
              {progressLabel}
            </p>
          </div>

          <Progress value={progress.percent} />
        </div>
      )}

      {/* ACTION BUTTONS */}

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t bg-background/80 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() =>
            router.push("/dashboard/products")
          }
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading || fetching}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              Update Product
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default EditProductForm;
