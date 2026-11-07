
"use client";

import * as React from "react";

import {
  CalendarDays,
  ChartNoAxesCombined,
  LayoutDashboard,
  Package,
  Scissors,
  Settings2,
  ShoppingBag,
  UsersRound,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Saloon Neo Admin Panel data
const data = {
  user: {
    name: "System Admin",
    email: "admin@saloonneo.com",
    avatar: "/avatars/shadcn.jpg",
  },

  teams: [
  {
    name: "Leo Saloon",
    logo: GalleryVerticalEnd,
    plan: "Administration",
  },
  {
    name: "Leo Saloon",
    logo: AudioWaveform,
    plan: "Management",
  },
  {
    name: "Leo Saloon",
    logo: Command,
    plan: "Business",
  },
],

  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      items: [],
    },
    {
      title: "Daily Operations",
      url: "/dashboard/appointments",
      icon: CalendarDays,
      items: [
        {
          title: "Appointments",
          url: "/dashboard/appointments",
        },
        {
          title: "Orders",
          url: "/dashboard/orders",
        },
      ],
    },
    {
      title: "Catalog",
      url: "/dashboard/products?page=1&limit=10",
      icon: Package,
      items: [
        {
          title: "Products",
          url: "/dashboard/products?page=1&limit=10",
        },
        {
          title: "Services",
          url: "/dashboard/services",
        },
      ],
    },
    {
      title: "Management",
      url: "/dashboard/users",
      icon: UsersRound,
      items: [
        {
          title: "All Users",
          url: "/dashboard/users",
        },
        {
          title: "Customers",
          url: "/dashboard/users/customers",
        },
        {
          title: "Staff Members",
          url: "/dashboard/users/staff",
        },
        {
          title: "Activity Logs",
          url: "/dashboard/users/activity",
        },
      ],
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: ChartNoAxesCombined,
      items: [],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [],
    },
  ],

  projects: [
    {
      name: "Appointments",
      url: "/dashboard/appointments",
      icon: CalendarDays,
    },
    {
      name: "Reports",
      url: "/dashboard/reports",
      icon: ChartNoAxesCombined,
    },
    {
      name: "Products",
      url: "/dashboard/products",
      icon: ShoppingBag,
    },
  ],
};

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  return (
    <Sidebar collapsible="icon" {...props}>

      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />

        <NavProjects projects={data.projects} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />

    </Sidebar>
  );
}
