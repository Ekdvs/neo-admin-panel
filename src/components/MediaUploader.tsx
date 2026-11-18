"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Image as ImageIcon,
  ImagePlus,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  ACCEPT,
  MAX_FILES,
  formatSize,
  getMediaType,
  validateMediaFile,
} from "@/lib/product-media";
import type { MediaType } from "@/types/productType";

export type MediaItem = {
  id: string;
  file: File;
  type: MediaType;
  preview: string;
};

interface MediaUploaderProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  disabled?: boolean;
  error?: string;
}

const MediaUploader = ({
  items,
  onChange,
  disabled = false,
  error,
}: MediaUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Revoke all preview URLs on unmount
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  const isFull = items.length >= MAX_FILES;
  const locked = disabled || isFull;

  const addFiles = (fileList: FileList | File[]) => {
    if (disabled) return;

    const available = MAX_FILES - items.length;
    if (available <= 0) {
      toast.error(`Maximum ${MAX_FILES} media files allowed`);
      return;
    }

    const accepted: MediaItem[] = [];

    for (const file of Array.from(fileList)) {
      const problem = validateMediaFile(file);
      if (problem) {
        toast.error(problem);
        continue;
      }

      if (accepted.length >= available) {
        toast.error(`You can add only ${available} more file(s)`);
        break;
      }

      accepted.push({
        id: crypto.randomUUID(),
        file,
        type: getMediaType(file)!,
        preview: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) onChange([...items, ...accepted]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
  };

  const handleDropZone = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
  };

  const remove = (id: string) => {
    const target = items.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.preview);
    onChange(items.filter((item) => item.id !== id));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);
  };

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={locked ? -1 : 0}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !locked) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!locked) setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={handleDropZone}
        onClick={() => !locked && inputRef.current?.click()}
        className={[
          "flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
          locked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          error ? "border-destructive" : "",
        ].join(" ")}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="h-6 w-6" />
        </div>

        <p className="text-sm font-semibold">
          Drag and drop images or videos, or click to browse
        </p>

        <p className="mt-2 text-xs text-muted-foreground">
          Up to {MAX_FILES} files · Images 10 MB · Videos 100 MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          disabled={locked}
          onChange={handleInput}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Previews */}
      {items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          <ImagePlus className="h-4 w-4" />
          No media selected yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable={!disabled}
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (draggedIndex !== null) move(draggedIndex, index);
                setDraggedIndex(null);
              }}
              onDragEnd={() => setDraggedIndex(null)}
              className={[
                "group relative overflow-hidden rounded-xl border bg-background transition-all",
                draggedIndex === index
                  ? "scale-95 opacity-40"
                  : "hover:border-primary/50 hover:shadow-md",
              ].join(" ")}
            >
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted">
                {item.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
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

                <Badge className="absolute left-2 top-2">
                  {index === 0 ? "Primary" : `#${index + 1}`}
                </Badge>

                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  disabled={disabled}
                  onClick={() => remove(item.id)}
                  aria-label="Remove media"
                  className="absolute right-2 top-2 h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 p-3">
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.type} · {formatSize(item.file.size)}
                  </p>
                </div>

                {item.type === "IMAGE" ? (
                  <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}

                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    disabled={disabled || index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label="Move media up"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    disabled={disabled || index === items.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label="Move media down"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;