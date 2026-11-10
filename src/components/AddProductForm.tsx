
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";

import type {
  Product,
  ProductStatus,
  MediaType,
  ApiResponse,
} from "@/types/productType";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Package,
  ImagePlus,
  Video,
  UploadCloud,
  X,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Trash2,
} from "lucide-react";

type MediaItem = {
  id: string;
  file: File;
  type: MediaType;
  preview: string;
};

type PresignResponse = {
  uploadUrl: string;
  fileUrl: string;
};

type ProductPayload = {
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
  media: {
    url: string;
    type: MediaType;
    sortOrder: number;
  }[];
};

const MAX_FILES = 10;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const AddProductForm = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [media, setMedia] = useState<MediaItem[]>([]);

  // Product fields
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [altName, setAltName] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [status, setStatus] = useState<ProductStatus>("ACTIVE");

  // Add files
  const handleFiles = (files: FileList | File[]) => {
    const selectedFiles = Array.from(files);

    const validFiles: MediaItem[] = [];

    for (const file of selectedFiles) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        toast.error(`${file.name}: Unsupported file type`);
        continue;
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name}: Image must be under 10 MB`);
        continue;
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        toast.error(`${file.name}: Video must be under 100 MB`);
        continue;
      }

      validFiles.push({
        id: crypto.randomUUID(),
        file,
        type: isImage ? "IMAGE" : "VIDEO",
        preview: URL.createObjectURL(file),
      });
    }

    setMedia((previous) => {
      const available = MAX_FILES - previous.length;

      if (available <= 0) {
        validFiles.forEach((item) => URL.revokeObjectURL(item.preview));
        toast.error("Maximum 10 media files allowed");
        return previous;
      }

      if (validFiles.length > available) {
        validFiles
          .slice(available)
          .forEach((item) => URL.revokeObjectURL(item.preview));

        toast.error(`You can add only ${available} more files`);
      }

      return [...previous, ...validFiles.slice(0, available)];
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop files
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Remove media
  const removeMedia = (id: string) => {
    setMedia((previous) => {
      const selected = previous.find((item) => item.id === id);

      if (selected) {
        URL.revokeObjectURL(selected.preview);
      }

      return previous.filter((item) => item.id !== id);
    });
  };

  // Reorder media
  const handleMediaDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleMediaDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      return;
    }

    setMedia((previous) => {
      const updated = [...previous];

      const [movedItem] = updated.splice(draggedIndex, 1);

      updated.splice(index, 0, movedItem);

      return updated;
    });

    setDraggedIndex(null);
  };

  // Upload a file directly to S3
  const uploadToS3 = async (file: File): Promise<string> => {
    const presignResponse = await api.post<
      ApiResponse<PresignResponse>
    >("/api/media/presign", {
      filename: file.name,
      contentType: file.type,
    });

    const { uploadUrl, fileUrl } = presignResponse.data.data;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload ${file.name} to S3`);
    }

    return fileUrl;
  };

  // Submit product
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!sku.trim() || !name.trim()) {
      toast.error("SKU and product name are required");
      return;
    }

    if (!price || Number(price) <= 0) {
      toast.error("Enter a valid product price");
      return;
    }

    if (
      stock.trim() === "" ||
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      toast.error("Enter a valid stock quantity");
      return;
    }

    if (
      compareAtPrice &&
      Number(compareAtPrice) <= Number(price)
    ) {
      toast.error("Compare-at price must be greater than the selling price");
      return;
    }

    try {
      setLoading(true);

      toast.loading("Uploading product media...", {
        id: "product-upload",
      });

      // Upload files in the selected order
      const uploadedMedia = await Promise.all(
        media.map(async (item, index) => {
          const url = await uploadToS3(item.file);

          return {
            url,
            type: item.type,
            sortOrder: index,
          };
        })
      );

      const payload: ProductPayload = {
        sku: sku.trim(),
        name: name.trim(),

        altName: altName
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        description: description.trim() || null,
        stock: Number(stock),
        status,
        price: Number(price),

        compareAtPrice: compareAtPrice
          ? Number(compareAtPrice)
          : null,

        brand: brand.trim() || null,
        model: model.trim() || null,

        media: uploadedMedia,
      };

      toast.loading("Creating product...", {
        id: "product-upload",
      });

      const response = await api.post<ApiResponse<Product>>(
        "/api/product",
        payload
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Product creation failed");
      }

      toast.success("Product created successfully!", {
        id: "product-upload",
      });

      // Release preview URLs
      media.forEach((item) => URL.revokeObjectURL(item.preview));

      router.push("/dashboard/products");
      router.refresh();

    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error
          ? (
              error.response as {
                data?: { message?: string };
              }
            )?.data?.message
          : error instanceof Error
            ? error.message
            : "Failed to create product";

      toast.error(message || "Failed to create product", {
        id: "product-upload",
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      id="add-product-form"
      onSubmit={handleSubmit}
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
              <CardTitle className="text-lg">
                Basic Information
              </CardTitle>

              <CardDescription>
                Enter the product identification and general details.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="grid grid-cols-1 gap-5 pt-6 md:grid-cols-2">

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>

            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. PROD-001"
              required
              disabled={loading}
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>

            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              required
              disabled={loading}
            />
          </div>

          {/* Alternative Names */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="altName">Alternative Names</Label>

            <Input
              id="altName"
              value={altName}
              onChange={(e) => setAltName(e.target.value)}
              placeholder="Name 1, Name 2, Name 3"
              disabled={loading}
            />

            <p className="text-xs text-muted-foreground">
              Separate alternative names using commas.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>

            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product..."
              rows={5}
              disabled={loading}
              className="resize-y"
            />
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>

            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Enter brand"
              disabled={loading}
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>

            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Enter model"
              disabled={loading}
            />
          </div>

        </CardContent>
      </Card>

      {/* PRICING AND INVENTORY */}
      <Card className="border shadow-sm">

        <CardHeader>
          <CardTitle className="text-lg">
            Pricing & Inventory
          </CardTitle>

          <CardDescription>
            Configure product pricing, stock and availability.
          </CardDescription>
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
              disabled={loading}
            />
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
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              placeholder="0.00"
              disabled={loading}
            />

            <p className="text-xs text-muted-foreground">
              Original price before discount.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock Quantity *</Label>

            <Input
              id="stock"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Product Status</Label>

            <select
              id="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as ProductStatus)
              }
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

        </CardContent>
      </Card>

      {/* PRODUCT MEDIA */}
      <Card className="border shadow-sm">

        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ImagePlus className="h-5 w-5" />
              </div>

              <div>
                <CardTitle className="text-lg">
                  Product Media
                </CardTitle>

                <CardDescription>
                  Upload product images and videos.
                </CardDescription>
              </div>
            </div>

            <Badge variant="secondary">
              {media.length} / {MAX_FILES} files
            </Badge>

          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-5 pt-6">

          {/* DROP AREA */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!loading) setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragging(false);
              }
            }}
            onDrop={handleDrop}
            onClick={() => {
              if (!loading && media.length < MAX_FILES) {
                fileInputRef.current?.click();
              }
            }}
            className={`
              flex min-h-48 cursor-pointer flex-col items-center
              justify-center rounded-xl border-2 border-dashed
              p-6 text-center transition-all
              ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
              }
              ${
                loading || media.length >= MAX_FILES
                  ? "cursor-not-allowed opacity-60"
                  : ""
              }
            `}
          >

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="h-7 w-7" />
            </div>

            <h3 className="text-sm font-semibold">
              Drag and drop your images or videos
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Or click here to browse files
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="gap-1">
                <ImageIcon className="h-3 w-3" />
                Images
              </Badge>

              <Badge variant="outline" className="gap-1">
                <Video className="h-3 w-3" />
                Videos
              </Badge>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Maximum 10 files · Images up to 10 MB · Videos up to 100 MB
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              disabled={loading || media.length >= MAX_FILES}
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(e.target.files);
                }
              }}
            />

          </div>

          {/* MEDIA PREVIEW */}
          {media.length > 0 && (
            <div className="space-y-4">

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    Uploaded Selection
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    Drag cards to change their display order.
                  </p>
                </div>

                <Badge variant="secondary">
                  {media.length} selected
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                {media.map((item, index) => (
                  <div
                    key={item.id}
                    draggable={!loading}
                    onDragStart={() => handleMediaDragStart(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMediaDrop(index);
                    }}
                    onDragEnd={() => setDraggedIndex(null)}
                    className={`
                      group relative overflow-hidden rounded-xl border
                      bg-background transition-all
                      ${
                        draggedIndex === index
                          ? "scale-95 opacity-40"
                          : "hover:border-primary/50 hover:shadow-md"
                      }
                    `}
                  >

                    {/* Preview */}
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted">

                      {item.type === "IMAGE" ? (
                        <img
                          src={item.preview}
                          alt={item.file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.preview}
                          controls
                          preload="metadata"
                          className="h-full w-full object-contain"
                        />
                      )}

                      {/* Order */}
                      <Badge className="absolute left-2 top-2">
                        {index === 0 ? "Primary" : `#${index + 1}`}
                      </Badge>

                      {/* Remove */}
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        disabled={loading}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMedia(item.id);
                        }}
                        className="absolute right-2 top-2 h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                    </div>

                    {/* Media Details */}
                    <div className="flex items-center gap-2 p-3">

                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {item.file.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {item.type} · {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      {item.type === "IMAGE" ? (
                        <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}

                    </div>

                  </div>
                ))}

              </div>

            </div>
          )}

          {media.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              <ImagePlus className="h-4 w-4" />
              No product media selected yet.
            </div>
          )}

        </CardContent>
      </Card>

      {/* FORM BOTTOM ACTIONS */}
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">

        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => router.push("/dashboard/products")}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Product...
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
