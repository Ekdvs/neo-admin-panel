
import { Suspense } from "react";
import { ShoppingBag } from "lucide-react";

import EditProductForm from "@/components/EditProductForm";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Edit Product",
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

// Loading UI while Next.js resolves the route parameter.
function EditProductFallback() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Loading edit product page...
      </p>
    </div>
  );
}

// This component accesses the runtime route parameter.
async function EditProductContent({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <div className="flex min-h-full w-full flex-col gap-6 p-4 sm:p-6">
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Edit Product
              </h1>

              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Update product information, pricing, inventory
                and media.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditProductForm productId={id} />
    </div>
  );
}

// Keep the page synchronous so the Suspense boundary
// exists before the runtime params are accessed.
export default function EditProductPage({
  params,
}: PageProps) {
  return (
    <Suspense fallback={<EditProductFallback />}>
      <EditProductContent params={params} />
    </Suspense>
  );
}
