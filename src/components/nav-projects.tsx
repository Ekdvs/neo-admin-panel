
"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  MoreHorizontalIcon,
  ExternalLinkIcon,
} from "lucide-react";

type Project = {
  name: string;
  url: string;
  icon: LucideIcon;
};

export function NavProjects({
  projects,
}: {
  projects: Project[];
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">

      <SidebarGroupLabel>
        Quick Access
      </SidebarGroupLabel>

      <SidebarMenu>
        {projects.map((item) => {
          const Icon = item.icon;

          return (
            <SidebarMenuItem key={item.url}>

              <SidebarMenuButton
                tooltip={item.name}
                render={
                  <Link
                    href={item.url}
                    onClick={() => setOpenMobile(false)}
                  />
                }
              >
                <Icon aria-hidden="true" />

                <span>{item.name}</span>
              </SidebarMenuButton>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuAction
                      showOnHover
                      className="aria-expanded:bg-muted"
                    />
                  }
                >
                  <MoreHorizontalIcon />

                  <span className="sr-only">
                    More options
                  </span>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-48"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem
                    render={
                      <Link
                        href={item.url}
                        onClick={() =>
                          setOpenMobile(false)
                        }
                      />
                    }
                  >
                    <ExternalLinkIcon />

                    <span>Open {item.name}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                </DropdownMenuContent>
              </DropdownMenu>

            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>

    </SidebarGroup>
  );
}
