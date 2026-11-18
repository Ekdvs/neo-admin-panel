"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { CheckCircle2, ImagePlus, Loader2, Package, Wallet } from "lucide-react";

import { createProduct, type CreateProgress } from "@/services/productService";
import type { ProductStatus } from "@/types/productType";

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

type FieldErrors = Partial<Record<keyof FormValues | "media", string>>;

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
  return "Failed to create product. Please try again.";
};

// Small field wrapper
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

const AddProductForm = () => {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [status, setStatus] = useState<ProductStatus>("ACTIVE");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<CreateProgress | null>(null);

  const setField =
    (key: keyof FormValues) =>
    (event: { target: { value: string } }) => {
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const validationErrors = validate(values);
    setErrors(validationErrors);

    const firstError = Object.values(validationErrors).find(Boolean);
    if (firstError) {
      toast.error(firstError);
      return;
    }

    setLoading(true);
    setProgress({ phase: "uploading", percent: 0 });

    try {
      const response = await createProduct(
        {
          sku: values.sku.trim(),
          name: values.name.trim(),
          altName: parseAltNames(values.altName),
          description: values.description.trim() || null,
          stock: Number(values.stock),
          status,
          price: Number(values.price),
          compareAtPrice: values.compareAtPrice.trim()
            ? Number(values.compareAtPrice)
            : null,
          brand: values.brand.trim() || null,
          model: values.model.trim() || null,
          media: media.map((item) => item.file),
        },
        setProgress,
      );

      if (!response.success) {
        throw new Error(response.message || "Product creation failed");
      }

      toast.success(response.message || "Product created successfully!");
      router.push("/dashboard/products");
      router.refresh();
    } catch (error: unknown) {
      console.error("Create product error:", error);

      const fieldErrors = getBackendFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);

      toast.error(getErrorMessage(error), { duration: 5000 });
      setLoading(false);
      setProgress(null);
    }
  };

  const progressLabel =
    progress?.phase === "uploading"
      ? `Uploading media… ${progress.percent}%`
      : "Saving product…";

  return (
    <form
      id="add-product-form"
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
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
                Product identification and general details.
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
              placeholder="e.g. PROD-001"
              disabled={loading}
              aria-invalid={!!errors.sku}
            />
          </Field>

          <Field id="name" label="Product Name" required error={errors.name}>
            <Input
              id="name"
              value={values.name}
              onChange={setField("name")}
              placeholder="Enter product name"
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
              placeholder="Describe your product..."
              rows={5}
              maxLength={1000}
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
              placeholder="Enter brand"
              disabled={loading}
              aria-invalid={!!errors.brand}
            />
          </Field>

          <Field id="model" label="Model" error={errors.model}>
            <Input
              id="model"
              value={values.model}
              onChange={setField("model")}
              placeholder="Enter model"
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
                Pricing, stock and availability.
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
              placeholder="0.00"
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
              placeholder="0.00"
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
              placeholder="0"
              disabled={loading}
              aria-invalid={!!errors.stock}
            />
          </Field>

          <Field id="status" label="Product Status">
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

      {/* MEDIA */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ImagePlus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Product Media</CardTitle>
                <CardDescription>
                  Upload images and videos. The first item is the primary media.
                </CardDescription>
              </div>
            </div>

            <Badge variant="secondary">
              {media.length} / {MAX_FILES} files
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <MediaUploader
            items={media}
            onChange={setMedia}
            disabled={loading}
            error={errors.media}
          />
        </CardContent>
      </Card>

      {/* PROGRESS */}
      {loading && progress && (
        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
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

        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Create Product
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddProductForm;