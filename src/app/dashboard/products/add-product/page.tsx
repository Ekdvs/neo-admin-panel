import { ShoppingBag } from "lucide-react";

import AddProductForm from "@/components/AddProductForm";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Add Product" };

const AddProductPage = () => {
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
                Add Product
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Create a new product by entering its details, pricing,
                inventory and media.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddProductForm />
    </div>
  );
};

export default AddProductPage;