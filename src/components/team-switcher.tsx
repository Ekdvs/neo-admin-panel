
"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  ChevronsUpDownIcon,
  PlusIcon,
} from "lucide-react";

type Team = {
  name: string;
  logo: LucideIcon;
  plan: string;
};

export function TeamSwitcher({
  teams,
}: {
  teams: Team[];
}) {
  const { isMobile } = useSidebar();

  const [activeTeam, setActiveTeam] =
    React.useState<Team | undefined>(teams[0]);

  if (!activeTeam) {
    return null;
  }

  // Render the selected team's logo as a component
  const ActiveLogo = activeTeam.logo;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>

          {/* Selected team */}
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <ActiveLogo className="size-4" />
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {activeTeam.name}
              </span>

              <span className="truncate text-xs text-muted-foreground">
                {activeTeam.plan}
              </span>
            </div>

            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>

          {/* Team dropdown */}
          <DropdownMenuContent
            className="w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Teams
              </DropdownMenuLabel>

              {teams.map((team, index) => {
                const TeamLogo = team.logo;

                return (
                  <DropdownMenuItem
                    key={team.plan}
                    onClick={() => setActiveTeam(team)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <TeamLogo className="size-4" />
                    </div>

                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">
                        {team.name}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {team.plan}
                      </span>
                    </div>

                    <DropdownMenuShortcut>
                      {index < 9 ? `⌘${index + 1}` : ""}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2 p-2"
                disabled
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <PlusIcon className="size-4" />
                </div>

                <span className="font-medium text-muted-foreground">
                  Add team
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
