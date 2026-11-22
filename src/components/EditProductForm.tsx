"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Package,
  Trash2,
  Wallet,
} from "lucide-react";

import {
  getProductById,
  updateProduct,
  type CreateProgress,
} from "@/services/productService";
import type { Product, ProductStatus } from "@/types/productType";

import MediaUploader, { type MediaItem } from "@/components/MediaUploader";
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

// Existing media rows from the DB. `id` is the DB row id (NOT an S3 key).
type ExistingMedia = {
  id: string;
  url: string; // presigned URL for display
  type: "IMAGE" | "VIDEO";
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

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

const validate = (values: FormValues): FieldErrors => {
  const errors: FieldErrors = {};
  const price = Number(values.price);
  const stock = Number(values.stock);
  const altNames = parseAltNames(values.altName);

  if (!values.sku.trim()) errors.sku = "SKU is required";
  else if (values.sku.trim().length > 100) errors.sku = "Max 100 characters";

  if (values.name.trim().length < 3)
    errors.name = "Product name must be at least 3 characters";
  else if (values.name.trim().length > 200) errors.name = "Max 200 characters";

  if (altNames.length > 10) errors.altName = "Maximum 10 alternative names";
  else if (altNames.some((n) => n.length > 200))
    errors.altName = "Each name must be under 200 characters";

  if (values.description.trim().length > 1000)
    errors.description = "Max 1000 characters";

  if (values.brand.trim().length > 100) errors.brand = "Max 100 characters";
  if (values.model.trim().length > 100) errors.model = "Max 100 characters";

  if (!values.price.trim() || !Number.isFinite(price) || price <= 0)
    errors.price = "Enter a valid price greater than 0";
  else if (price > 1_000_000) errors.price = "Price cannot exceed 1,000,000";

  if (
    values.stock.trim() === "" ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    stock > 1_000_000
  )
    errors.stock = "Enter a whole number between 0 and 1,000,000";

  if (values.compareAtPrice.trim() !== "") {
    const compare = Number(values.compareAtPrice);
    if (!Number.isFinite(compare) || compare <= price)
      errors.compareAtPrice = "Must be greater than the selling price";
  }

  return errors;
};

const getBackendFieldErrors = (error: unknown): FieldErrors => {
  if (!axios.isAxiosError(error)) return {};

  const raw = error.response?.data?.errors as
    | Record<string, string[] | undefined>
    | null
    | undefined;

  if (!raw || typeof raw !== "object") return {};

  const result: FieldErrors = {};
  for (const [key, messages] of Object.entries(raw)) {
    if (Array.isArray(messages) && messages[0]) {
      result[key as keyof FieldErrors] = messages[0];
    }
  }
  return result;
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") return "Request timed out. Try again.";
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return "Failed to update product. Please try again.";
};

const Field = ({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) => (
  <div className={`space-y-2 ${className ?? ""}`}>
    <Label htmlFor={id}>
      {label}
      {required && <span className="text-destructive"> *</span>}
    </Label>
    {children}
    {error ? (
      <p className="text-xs text-destructive">{error}</p>
    ) : hint ? (
      <p className="text-xs text-muted-foreground">{hint}</p>
    ) : null}
  </div>
);

const EditProductForm = ({ productId }: { productId: string }) => {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [status, setStatus] = useState<ProductStatus>("ACTIVE");

  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
  const [newMedia, setNewMedia] = useState<MediaItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [progress, setProgress] = useState<CreateProgress | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Load product
  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      try {
        setFetching(true);
        const product: Product = await getProductById(productId);
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
            product.compareAtPrice != null ? String(product.compareAtPrice) : "",
          stock: String(product.stock ?? 0),
        });

        setStatus(product.status === "DELETED" ? "INACTIVE" : product.status);

        setExistingMedia(
          [...(product.media ?? [])]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => ({ id: item.id, url: item.url, type: item.type })),
        );
      } catch (error) {
        console.error("Load product error:", error);
        toast.error(getErrorMessage(error));
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
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    };

  const removeExistingMedia = (id: string) => {
    setExistingMedia((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || fetching) return;

    const validationErrors = validate(values);
    setErrors(validationErrors);

    const firstError = Object.values(validationErrors).find(Boolean);
    if (firstError) {
      toast.error(firstError);
      return;
    }

    if (existingMedia.length + newMedia.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} media files allowed`);
      return;
    }

    setLoading(true);
    setProgress({ phase: "uploading", percent: 0 });

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
          status: Number(values.stock) === 0 ? "INACTIVE" : status,
          media: newMedia.map((item) => item.file),
          existingMedia: existingMedia.map((item) => ({ id: item.id })),
        },
        setProgress,
      );

      if (!response.success) {
        throw new Error(response.message || "Product update failed");
      }

      toast.success(response.message || "Product updated successfully!");
      router.push("/dashboard/products");
      router.refresh();
    } catch (error) {
      console.error("Update product error:", error);

      const fieldErrors = getBackendFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);

      toast.error(getErrorMessage(error), { duration: 5000 });
      setLoading(false);
      setProgress(null);
    }
  };

  const progressLabel =
    progress?.phase === "uploading"
      ? `Uploading new media… ${progress.percent}%`
      : "Saving product changes…";

  if (fetching) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Loading product information…
        </p>
      </div>
    );
  }

  const totalMedia = existingMedia.length + newMedia.length;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* BASIC INFORMATION */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Update product identification and details.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="grid grid-cols-1 gap-5 pt-6 md:grid-cols-2">
          <Field id="sku" label="SKU" required error={errors.sku}>
            <Input
              id="sku"
              value={values.sku}
              onChange={setField("sku")}
              disabled={loading}
              aria-invalid={!!errors.sku}
            />
          </Field>

          <Field id="name" label="Product Name" required error={errors.name}>
            <Input
              id="name"
              value={values.name}
              onChange={setField("name")}
              disabled={loading}
              aria-invalid={!!errors.name}
            />
          </Field>

          <Field
            id="altName"
            label="Alternative Names"
            error={errors.altName}
            hint="Separate names with commas."
            className="md:col-span-2"
          >
            <Input
              id="altName"
              value={values.altName}
              onChange={setField("altName")}
              placeholder="Name 1, Name 2, Name 3"
              disabled={loading}
              aria-invalid={!!errors.altName}
            />
          </Field>

          <Field
            id="description"
            label="Description"
            error={errors.description}
            hint={`${values.description.length} / 1000`}
            className="md:col-span-2"
          >
            <Textarea
              id="description"
              value={values.description}
              onChange={setField("description")}
              maxLength={1000}
              rows={5}
              disabled={loading}
              className="resize-y"
              aria-invalid={!!errors.description}
            />
          </Field>

          <Field id="brand" label="Brand" error={errors.brand}>
            <Input
              id="brand"
              value={values.brand}
              onChange={setField("brand")}
              disabled={loading}
              aria-invalid={!!errors.brand}
            />
          </Field>

          <Field id="model" label="Model" error={errors.model}>
            <Input
              id="model"
              value={values.model}
              onChange={setField("model")}
              disabled={loading}
              aria-invalid={!!errors.model}
            />
          </Field>
        </CardContent>
      </Card>

      {/* PRICING & INVENTORY */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Pricing & Inventory</CardTitle>
              <CardDescription>
                Update selling price, stock and availability.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="grid grid-cols-1 gap-5 pt-6 md:grid-cols-2">
          <Field id="price" label="Selling Price" required error={errors.price}>
            <Input
              id="price"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={values.price}
              onChange={setField("price")}
              disabled={loading}
              aria-invalid={!!errors.price}
            />
          </Field>

          <Field
            id="compareAtPrice"
            label="Compare-at Price"
            error={errors.compareAtPrice}
            hint="Original price before discount."
          >
            <Input
              id="compareAtPrice"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={values.compareAtPrice}
              onChange={setField("compareAtPrice")}
              disabled={loading}
              aria-invalid={!!errors.compareAtPrice}
            />
          </Field>

          <Field id="stock" label="Stock Quantity" required error={errors.stock}>
            <Input
              id="stock"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={values.stock}
              onChange={setField("stock")}
              disabled={loading}
              aria-invalid={!!errors.stock}
            />
          </Field>

          <Field
            id="status"
            label="Product Status"
            hint={
              Number(values.stock) === 0
                ? "Products with 0 stock are saved as Inactive."
                : undefined
            }
          >
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as ProductStatus)}
              disabled={loading}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {/* EXISTING MEDIA */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ImagePlus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Existing Media</CardTitle>
                <CardDescription>
                  Remove media you no longer need. The first item is the primary
                  media.
                </CardDescription>
              </div>
            </div>

            <Badge variant="secondary">
              {totalMedia} / {MAX_FILES} files
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {existingMedia.length === 0 ? (
            <p className="text-sm text-muted-foreground">No existing media.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {existingMedia.map((item) => (
                <div
                  key={item.id}
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
                    <Badge variant="secondary">{item.type}</Badge>

                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="size-8"
                      disabled={loading}
                      onClick={() => removeExistingMedia(item.id)}
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
          <CardTitle className="text-lg">Add New Media</CardTitle>
          <CardDescription>Upload additional images and videos.</CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <MediaUploader
            items={newMedia}
            onChange={setNewMedia}
            disabled={loading || totalMedia >= MAX_FILES}
          />
        </CardContent>
      </Card>

      {/* PROGRESS */}
      {loading && progress && (
        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-sm font-medium">{progressLabel}</p>
          </div>
          <Progress value={progress.percent} />
        </div>
      )}

      {/* ACTIONS */}
      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t bg-background/80 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => router.push("/dashboard/products")}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={loading || fetching} className="gap-2">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Updating…
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