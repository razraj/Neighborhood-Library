"use client";

import { useBorrowBookMutation, useReturnBookMutation, useUserLoansQuery } from "@/hooks/use-library-queries";
import { useCurrentUser } from "@/hooks/use-user-queries";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useForm } from "@tanstack/react-form-nextjs";
import { BookOpen, Calendar, CheckCircle2, Clock, RotateCcw } from "lucide-react";

export function LendingConsole({
    selectedBookId,
    onSelectBookId,
}: {
    selectedBookId?: string;
    onSelectBookId?: (id: string) => void;
}) {
    const { data: user } = useCurrentUser();
    const { data: activeLoans, isLoading: loansLoading } = useUserLoansQuery(user?.id);
    const borrowMutation = useBorrowBookMutation();
    const returnMutation = useReturnBookMutation();

    const borrowForm = useForm({
        defaultValues: {
            bookId: selectedBookId ?? "",
            daysToBorrow: 14,
        },
        onSubmit: async ({ value }) => {
            if (!value.bookId.trim()) return;
            await borrowMutation.mutateAsync({
                bookId: value.bookId.trim(),
                daysToBorrow: Number(value.daysToBorrow) || 14,
            });
            borrowForm.reset({ bookId: "", daysToBorrow: 14 });
        },
    });

    const handleReturn = async (loanId: string) => {
        await returnMutation.mutateAsync({ loanId });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Quick Borrow Card */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Quick Borrow</CardTitle>
                            <CardDescription>Checkout a book copy for your library account</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void borrowForm.handleSubmit();
                        }}
                    >
                        <FieldGroup className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-7">
                                <borrowForm.Field
                                    name="bookId"
                                    validators={{
                                        onChange: ({ value }) => (value.trim() ? undefined : "Book ID is required"),
                                    }}
                                >
                                    {(field) => (
                                        <Field>
                                            <FieldLabel htmlFor="bookId">Book ID</FieldLabel>
                                            <Input
                                                id="bookId"
                                                placeholder="e.g. BK-xxxx or paste from inspector"
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                            />
                                            {field.state.meta.errors.length > 0 ? (
                                                <p className="text-xs text-destructive mt-1">{field.state.meta.errors.join(", ")}</p>
                                            ) : null}
                                        </Field>
                                    )}
                                </borrowForm.Field>
                            </div>

                            <div className="md:col-span-3">
                                <borrowForm.Field name="daysToBorrow">
                                    {(field) => (
                                        <Field>
                                            <FieldLabel htmlFor="daysToBorrow">Duration (Days)</FieldLabel>
                                            <Input
                                                id="daysToBorrow"
                                                type="number"
                                                min={1}
                                                max={60}
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                            />
                                        </Field>
                                    )}
                                </borrowForm.Field>
                            </div>

                            <div className="md:col-span-2">
                                <borrowForm.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                                    {([canSubmit, isSubmitting]) => (
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={!canSubmit || isSubmitting || borrowMutation.isPending}
                                        >
                                            {isSubmitting || borrowMutation.isPending ? "Checking out..." : "Borrow"}
                                        </Button>
                                    )}
                                </borrowForm.Subscribe>
                            </div>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>

            {/* My Active Loans Card */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">My Active Loans</CardTitle>
                                <CardDescription>Manage your currently borrowed books and returns</CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="px-2.5 py-1">
                            {activeLoans?.length || 0} active
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {loansLoading ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">Loading active loans...</div>
                    ) : !activeLoans || activeLoans.length === 0 ? (
                        <div className="py-10 text-center flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg">
                            <CheckCircle2 className="h-8 w-8 text-muted-foreground/60" />
                            <p className="text-sm font-medium text-foreground">No active loans</p>
                            <p className="text-xs text-muted-foreground max-w-sm">
                                You don&apos;t have any books checked out right now. Borrow a book above or inspect the catalog.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Book Title</TableHead>
                                        <TableHead>Copy ID</TableHead>
                                        <TableHead>Borrow Date</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeLoans.map((loan) => (
                                        <TableRow key={loan.loanId} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">
                                                {onSelectBookId ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onSelectBookId(loan.copyId)}
                                                        className="hover:underline text-left"
                                                    >
                                                        {loan.bookTitle}
                                                    </button>
                                                ) : (
                                                    <span>{loan.bookTitle}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {loan.copyId.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(loan.borrowDate).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <span
                                                    className={`flex items-center gap-1 font-medium ${
                                                        loan.isOverdue ? "text-destructive" : "text-foreground"
                                                    }`}
                                                >
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(loan.dueDate).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {loan.isOverdue ? (
                                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                                        Overdue
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                                                        Active
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReturn(loan.loanId)}
                                                    disabled={returnMutation.isPending}
                                                    className="gap-1.5 h-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                    Return
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
