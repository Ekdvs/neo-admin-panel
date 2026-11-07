
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="min-w-0">

        <DashboardHeader />

        <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
}
