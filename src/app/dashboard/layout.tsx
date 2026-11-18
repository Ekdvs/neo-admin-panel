
import type { ReactNode } from "react";
import { Suspense } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

function SidebarFallback() {
  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="h-full animate-pulse rounded-md bg-muted/30" />
    </aside>
  );
}

function DashboardHeaderFallback() {
  return (
    <header className="flex h-16 items-center border-b px-4 md:px-6">
      <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarFallback />}>
        <AppSidebar />
      </Suspense>

      <SidebarInset className="min-w-0">
        <Suspense fallback={<DashboardHeaderFallback />}>
          <DashboardHeader />
        </Suspense>

        <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
