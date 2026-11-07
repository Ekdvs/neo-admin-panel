
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

type NavSubItem = {
  title: string;
  url: string;
};

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: NavSubItem[];
};

function matchesRoute(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export function NavMain({
  items,
}: {
  items: NavItem[];
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        Platform
      </SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon;

          const hasSubItems =
            !!item.items && item.items.length > 0;

          const active = hasSubItems
            ? item.items!.some((subItem) =>
                matchesRoute(pathname, subItem.url)
              )
            : matchesRoute(pathname, item.url);

          // Direct navigation item
          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  render={
                    <Link
                      href={item.url}
                      aria-current={
                        active ? "page" : undefined
                      }
                      onClick={() => setOpenMobile(false)}
                    />
                  }
                  isActive={active}
                  tooltip={item.title}
                >
                  <Icon aria-hidden="true" />

                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Expandable navigation item
          return (
            <Collapsible
              key={`${item.url}-${pathname}`}
              defaultOpen={active}
              className="group/collapsible"
            >
              <SidebarMenuItem>

                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={active}
                      aria-expanded={active}
                    />
                  }
                >
                  <Icon aria-hidden="true" />

                  <span>{item.title}</span>

                  <ChevronDown
                    aria-hidden="true"
                    className="ml-auto transition-transform duration-200 group-data-[panel-open]/collapsible:rotate-180"
                  />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items!.map((subItem) => {
                      const subActive =
                        matchesRoute(
                          pathname,
                          subItem.url
                        );

                      return (
                        <SidebarMenuSubItem
                          key={subItem.url}
                        >
                          <SidebarMenuSubButton
                            render={
                              <Link
                                href={subItem.url}
                                aria-current={
                                  subActive
                                    ? "page"
                                    : undefined
                                }
                                onClick={() =>
                                  setOpenMobile(false)
                                }
                              />
                            }
                            isActive={subActive}
                          >
                            <span>
                              {subItem.title}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>

              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
