"use client";

import { NavMain } from "@/components/nav-main";
import { useCurrentUser } from "@/hooks/use-user-queries";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@repo/ui/components/sidebar";
import { Skeleton } from "@repo/ui/components/skeleton";
import { BookOpen, Library, LucideIcon, Settings, Settings2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { NavUser } from "./nav-user";

export interface Data {
    navMain: {
        title: string;
        url: string;
        icon: LucideIcon;
        items?: {
            title: string;
            url: string;
            icon: LucideIcon;
        }[];
    }[];
}

const navItems: Data["navMain"] = [
    {
        title: "Library Console",
        url: "/dashboard",
        icon: BookOpen,
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings2,
        items: [
            {
                title: "My Account",
                url: "/settings",
                icon: Settings,
            },
        ],
    },
];

function displayName(user: {
    firstName?: string | null;
    lastName?: string | null;
}): string {
    const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return full || "Library Member";
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { data: sessionUser, isLoading } = useCurrentUser();

    const navUser = sessionUser
        ? {
              name: displayName(sessionUser),
              email: sessionUser.email ?? "",
              avatar: "",
          }
        : null;

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <Library className="h-4 w-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Neighborhood Library</span>
                                    <span className="truncate text-xs text-muted-foreground">Management Console</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>
            <SidebarFooter>
                {isLoading ? (
                    <div className="flex items-center gap-2 px-2 py-1.5">
                        <Skeleton className="size-8 rounded-lg" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-2 w-32" />
                        </div>
                    </div>
                ) : navUser ? (
                    <NavUser user={navUser} />
                ) : null}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
