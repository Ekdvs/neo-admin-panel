
"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddProductForm from "@/components/AddProductForm";

import {
  ShoppingBag,
  Plus,
  X,
} from "lucide-react";

const AddProductPage = () => {
  return (
    <div className="flex min-h-full w-full flex-col gap-6 p-4 sm:p-6">

      {/* Page Header */}
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-5 sm:p-7">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            {/* Heading */}
            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShoppingBag className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Add Product
                </h1>

                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  Create a new product by entering its details,
                  pricing, inventory and product media.
                </p>
              </div>

            </div>

            {/* Header Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">

              {/* Cancel */}
              <Button
               
                variant="outline"
                className="gap-2"
              >
                <Link href="/dashboard/products">
                  <X className="h-4 w-4" />
                  Cancel
                </Link>
              </Button>

              {/* Submit Form */}
              <Button
                type="submit"
                form="add-product-form"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>

            </div>

          </div>

        </CardContent>
      </Card>

      {/* Product Form */}
      <AddProductForm />

    </div>
  );
};

export default AddProductPage;
