"use client";

import { useCurrentUser } from "@/hooks/use-user-queries";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { BookInspector } from "@/components/book-inspector";
import { LendingConsole } from "@/components/lending-console";
import { MembersConsole } from "@/components/members-console";
import { Badge } from "@repo/ui/components/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@repo/ui/components/breadcrumb";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui/components/sidebar";
import { BookOpen, Library, RotateCcw, Search, Users } from "lucide-react";
import { useState } from "react";

export default function DashboardPage() {
    const { data: user } = useCurrentUser();
    const [activeTab, setActiveTab] = useState<"lending" | "books" | "members">("lending");
    const [selectedBookId, setSelectedBookId] = useState<string>("");

    const handleSelectBook = (id: string) => {
        setSelectedBookId(id);
        setActiveTab("books");
    };

    return (
        <AuthGuard requireUnauthenticated={false}>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    {/* Top Header */}
                    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="font-semibold text-foreground">
                                            Library Management Console
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                        {user && (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/5 text-primary text-xs py-1 px-2.5">
                                    Signed in as {user.firstName || user.email}
                                </Badge>
                            </div>
                        )}
                    </header>

                    {/* Main Content Area */}
                    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                        {/* Hero / Quick Nav Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-muted/40 p-4 rounded-xl border">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-sm">
                                    <Library className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight">Neighborhood Library</h1>
                                    <p className="text-xs text-muted-foreground">
                                        Manage book inventory, circulation lending, and library members.
                                    </p>
                                </div>
                            </div>

                            {/* Section Switcher Tabs */}
                            <div className="flex items-center gap-1.5 bg-background p-1 rounded-lg border shadow-xs self-start sm:self-auto">
                                <Button
                                    variant={activeTab === "lending" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setActiveTab("lending")}
                                    className="gap-1.5 h-8 text-xs font-medium"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Lending & Returns
                                </Button>
                                <Button
                                    variant={activeTab === "books" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setActiveTab("books")}
                                    className="gap-1.5 h-8 text-xs font-medium"
                                >
                                    <BookOpen className="h-3.5 w-3.5" />
                                    Book Inspector
                                </Button>
                                <Button
                                    variant={activeTab === "members" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setActiveTab("members")}
                                    className="gap-1.5 h-8 text-xs font-medium"
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    Members Roster
                                </Button>
                            </div>
                        </div>

                        {/* Tab Panels */}
                        {activeTab === "lending" && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-8">
                                    <LendingConsole
                                        selectedBookId={selectedBookId}
                                        onSelectBookId={handleSelectBook}
                                    />
                                </div>
                                <div className="lg:col-span-4 flex flex-col gap-4">
                                    <Card className="border shadow-sm">
                                        <CardContent className="p-4 space-y-3">
                                            <h3 className="text-sm font-semibold flex items-center gap-1.5">
                                                <Search className="h-4 w-4 text-primary" />
                                                Quick Actions
                                            </h3>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Need to check a book&apos;s availability or copies count? Use the Book Inspector to lookup live status and borrower history.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setActiveTab("books")}
                                                className="w-full gap-1.5"
                                            >
                                                <BookOpen className="h-3.5 w-3.5" />
                                                Open Book Inspector
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setActiveTab("members")}
                                                className="w-full gap-1.5"
                                            >
                                                <Users className="h-3.5 w-3.5" />
                                                View Member Directory
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {activeTab === "books" && (
                            <BookInspector
                                bookId={selectedBookId}
                                onBookIdChange={setSelectedBookId}
                            />
                        )}

                        {activeTab === "members" && (
                            <MembersConsole />
                        )}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    );
}
