
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

function formatSegment(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DashboardHeader() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">

      <SidebarTrigger className="-ml-1" />

      <Separator
        orientation="vertical"
        className="mr-2 h-4"
      />

      <Breadcrumb>
        <BreadcrumbList>

          {segments.map((segment, index) => {
            const href =
              "/" + segments.slice(0, index + 1).join("/");

            const isLast =
              index === segments.length - 1;

            const label = formatSegment(segment);

            return (
              <div
                key={href}
                className="contents"
              >
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>
                      {label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={<Link href={href} />}
                    >
                      {label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>

                {!isLast && (
                  <BreadcrumbSeparator />
                )}
              </div>
            );
          })}

        </BreadcrumbList>
      </Breadcrumb>

    </header>
  );
}
