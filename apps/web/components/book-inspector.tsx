"use client";

import { useBookStatusQuery, useBorrowBookMutation } from "@/hooks/use-library-queries";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { BookMarked, BookOpen, Check, Copy, Library, Search, UserCheck } from "lucide-react";
import { useState } from "react";
import { BookFormModal } from "./book-form-modal";

export function BookInspector({
    bookId,
    onBookIdChange,
}: {
    bookId: string;
    onBookIdChange: (id: string) => void;
}) {
    const [searchInput, setSearchInput] = useState(bookId || "");
    const [copied, setCopied] = useState(false);
    const [recentIds, setRecentIds] = useState<string[]>([]);

    const {
        data: bookStatus,
        isLoading,
        isError,
        error,
    } = useBookStatusQuery(bookId, Boolean(bookId && bookId.trim().length > 0));

    const borrowMutation = useBorrowBookMutation();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchInput.trim();
        if (trimmed) {
            onBookIdChange(trimmed);
            if (!recentIds.includes(trimmed)) {
                setRecentIds((prev) => [trimmed, ...prev.slice(0, 4)]);
            }
        }
    };

    const handleCopyId = () => {
        if (!bookStatus?.bookId) return;
        navigator.clipboard.writeText(bookStatus.bookId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleQuickBorrow = async () => {
        if (!bookStatus?.bookId) return;
        await borrowMutation.mutateAsync({
            bookId: bookStatus.bookId,
            daysToBorrow: 14,
        });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Lookup & Action Header Card */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
                                <Search className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Book Status & Catalog Inspector</CardTitle>
                                <CardDescription>Search by Book ID to view inventory, copies, and active borrowers</CardDescription>
                            </div>
                        </div>
                        <BookFormModal
                            onBookCreated={(newId) => {
                                setSearchInput(newId);
                                onBookIdChange(newId);
                                setRecentIds((prev) => [newId, ...prev.filter((id) => id !== newId).slice(0, 4)]);
                            }}
                        />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Enter Book ID (e.g. BK-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary" className="gap-1.5">
                            Inspect
                        </Button>
                    </form>

                    {recentIds.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span>Recent lookups:</span>
                            {recentIds.map((id) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => {
                                        setSearchInput(id);
                                        onBookIdChange(id);
                                    }}
                                    className="font-mono bg-muted hover:bg-muted/80 px-2 py-0.5 rounded text-foreground transition-colors"
                                >
                                    {id.slice(0, 10)}...
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Book Details & Inventory Display */}
            {isLoading ? (
                <Card className="border p-8 text-center text-muted-foreground text-sm">
                    Fetching book status and copy records...
                </Card>
            ) : isError ? (
                <Card className="border border-destructive/20 bg-destructive/5 p-6 text-center">
                    <p className="text-sm font-semibold text-destructive">
                        {error instanceof Error ? error.message : "Failed to find book with this ID."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Please verify the Book ID or register the book using the &quot;Add / Manage Book&quot; button.
                    </p>
                </Card>
            ) : !bookStatus ? (
                <Card className="border border-dashed p-10 text-center flex flex-col items-center justify-center gap-2">
                    <Library className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No book selected</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        Enter a Book ID in the search bar above or click on a book in your loans or member records to inspect live details.
                    </p>
                </Card>
            ) : (
                <Card className="border shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b pb-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="font-mono text-xs gap-1 py-0.5">
                                        ID: {bookStatus.bookId}
                                        <button
                                            type="button"
                                            onClick={handleCopyId}
                                            className="ml-1 hover:text-foreground text-muted-foreground"
                                            title="Copy ID"
                                        >
                                            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                        </button>
                                    </Badge>
                                    {bookStatus.isbn && (
                                        <Badge variant="secondary" className="text-xs">
                                            ISBN: {bookStatus.isbn}
                                        </Badge>
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                                    {bookStatus.title}
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <UserCheck className="h-4 w-4" />
                                    <span>
                                        {bookStatus.authors && bookStatus.authors.length > 0
                                            ? bookStatus.authors.join(", ")
                                            : "Unknown Author"}
                                    </span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleQuickBorrow}
                                    disabled={bookStatus.inventorySummary.available <= 0 || borrowMutation.isPending}
                                    className="gap-2 shadow-sm"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    {bookStatus.inventorySummary.available > 0
                                        ? "Borrow This Book"
                                        : "No Copies Available"}
                                </Button>
                            </div>
                        </div>

                        {/* Inventory Summary Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-4 border-t">
                            <div className="bg-background rounded-lg p-2.5 border text-center">
                                <p className="text-xs text-muted-foreground font-medium">Total Copies</p>
                                <p className="text-xl font-bold text-foreground">{bookStatus.inventorySummary.total}</p>
                            </div>
                            <div className="bg-background rounded-lg p-2.5 border text-center">
                                <p className="text-xs text-emerald-600 font-medium">Available</p>
                                <p className="text-xl font-bold text-emerald-600">{bookStatus.inventorySummary.available}</p>
                            </div>
                            <div className="bg-background rounded-lg p-2.5 border text-center">
                                <p className="text-xs text-blue-600 font-medium">Borrowed</p>
                                <p className="text-xl font-bold text-blue-600">{bookStatus.inventorySummary.borrowed}</p>
                            </div>
                            <div className="bg-background rounded-lg p-2.5 border text-center">
                                <p className="text-xs text-amber-600 font-medium">Maintenance</p>
                                <p className="text-xl font-bold text-amber-600">{bookStatus.inventorySummary.maintenance}</p>
                            </div>
                            <div className="bg-background rounded-lg p-2.5 border text-center col-span-2 sm:col-span-1">
                                <p className="text-xs text-rose-600 font-medium">Lost</p>
                                <p className="text-xl font-bold text-rose-600">{bookStatus.inventorySummary.lost}</p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold flex items-center gap-1.5">
                                <BookMarked className="h-4 w-4 text-primary" />
                                Individual Copies Inventory ({bookStatus.copies.length})
                            </h4>
                        </div>

                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Copy ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Current Borrower</TableHead>
                                        <TableHead>Borrow Date</TableHead>
                                        <TableHead>Due Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookStatus.copies.map((copy) => (
                                        <TableRow key={copy.copyId} className="hover:bg-muted/30">
                                            <TableCell className="font-mono text-xs font-medium">
                                                {copy.copyId.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell>
                                                {copy.status === "available" ? (
                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                                                        Available
                                                    </Badge>
                                                ) : copy.status === "borrowed" ? (
                                                    copy.isOverdue ? (
                                                        <Badge variant="destructive">Borrowed (Overdue)</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                                                            Borrowed
                                                        </Badge>
                                                    )
                                                ) : copy.status === "maintenance" ? (
                                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-700">
                                                        Maintenance
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-rose-500/10 text-rose-700">
                                                        Lost
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {copy.currentBorrower ? (
                                                    <div>
                                                        <p className="font-medium">{copy.currentBorrower}</p>
                                                        {copy.borrowerEmail && (
                                                            <p className="text-xs text-muted-foreground">{copy.borrowerEmail}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/60 text-xs">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {copy.borrowDate ? new Date(copy.borrowDate).toLocaleDateString() : "—"}
                                            </TableCell>
                                            <TableCell className="text-xs font-medium">
                                                {copy.dueDate ? (
                                                    <span className={copy.isOverdue ? "text-destructive font-semibold" : ""}>
                                                        {new Date(copy.dueDate).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
