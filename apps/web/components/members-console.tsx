"use client";

import { useMembersQuery, useUserLoansQuery } from "@/hooks/use-library-queries";
import { Member } from "@/types";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { BookOpen, Calendar, Check, Copy, Mail, Phone, Search, User, Users } from "lucide-react";
import { useState } from "react";

export function MembersConsole() {
    const { data: membersData, isLoading: membersLoading } = useMembersQuery();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const { data: memberLoans, isLoading: loansLoading } = useUserLoansQuery(
        selectedMember?.id
    );

    const members = membersData?.members || [];
    const filteredMembers = members.filter((m) => {
        const query = searchQuery.toLowerCase();
        const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
        const email = (m.email || "").toLowerCase();
        const phone = (m.phone || "").toLowerCase();
        return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="flex flex-col gap-6">
            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Members Directory</CardTitle>
                                <CardDescription>Browse library members and inspect their active book borrowings</CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="px-3 py-1 font-medium">
                            {members.length} Registered Members
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter members by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {membersLoading ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">Loading members roster...</div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            {searchQuery ? "No members match your search." : "No registered members found."}
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Member ID</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMembers.map((m) => (
                                        <TableRow key={m.id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                                                        {m.firstName?.[0] || "M"}{m.lastName?.[0] || ""}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm text-foreground">
                                                            {m.firstName} {m.lastName}
                                                        </p>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {m.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {m.phone ? (
                                                    <span className="flex items-center gap-1 text-xs">
                                                        <Phone className="h-3 w-3" />
                                                        {m.phone}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/60">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyId(m.id)}
                                                    className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground bg-muted/60 px-2 py-0.5 rounded transition-colors"
                                                    title="Copy Member ID"
                                                >
                                                    {m.id.slice(0, 8)}...
                                                    {copiedId === m.id ? (
                                                        <Check className="h-3 w-3 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {m.joinDate ? new Date(m.joinDate).toLocaleDateString() : "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setSelectedMember(m)}
                                                    className="gap-1.5 h-8 text-xs font-medium"
                                                >
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    View Loans
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

            {/* Member Loans Inspection Dialog */}
            <Dialog open={Boolean(selectedMember)} onOpenChange={(open) => !open && setSelectedMember(null)}>
                <DialogContent className="sm:max-w-[620px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 text-primary rounded-full">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle>
                                    {selectedMember?.firstName} {selectedMember?.lastName}
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    {selectedMember?.email} • ID: {selectedMember?.id}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4 text-primary" />
                                Active Borrowed Books
                            </h4>
                            <Badge variant="outline">
                                {memberLoans?.length || 0} active
                            </Badge>
                        </div>

                        {loansLoading ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">Loading member loans...</div>
                        ) : !memberLoans || memberLoans.length === 0 ? (
                            <div className="py-8 text-center border border-dashed rounded-lg text-sm text-muted-foreground">
                                This member has no active loans currently.
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Book Title</TableHead>
                                            <TableHead>Borrow Date</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {memberLoans.map((loan) => (
                                            <TableRow key={loan.loanId}>
                                                <TableCell className="font-medium text-sm">
                                                    {loan.bookTitle}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(loan.borrowDate).toLocaleDateString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs">
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
                                                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                                                            Overdue
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs"
                                                        >
                                                            Active
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
