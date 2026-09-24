import {
    ActiveLoan,
    BookStatusReport,
    BorrowBookInput,
    CreateBookInput,
    MembersResponse,
    ReturnBookInput
} from "@/types";
import { fetchWithAuth } from "@/utils/api";

export async function getBookStatusAction(bookId: string): Promise<BookStatusReport> {
    if (!bookId || !bookId.trim()) {
        throw new Error("Book ID is required");
    }
    return (await fetchWithAuth(`/books/${encodeURIComponent(bookId.trim())}/status`)) as BookStatusReport;
}

export async function createOrUpdateBookAction(input: CreateBookInput): Promise<{ bookId: string; title: string }> {
    return (await fetchWithAuth("/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
    })) as { bookId: string; title: string };
}

export async function borrowBookAction(input: BorrowBookInput): Promise<{ loan: ActiveLoan }> {
    return (await fetchWithAuth("/loans/borrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            bookId: input.bookId,
            daysToBorrow: Number(input.daysToBorrow) || 14
        })
    })) as { loan: ActiveLoan };
}

export async function returnBookAction(input: ReturnBookInput): Promise<{ loan: ActiveLoan }> {
    return (await fetchWithAuth("/loans/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            loanId: input.loanId
        })
    })) as { loan: ActiveLoan };
}

export async function getMembersAction(): Promise<MembersResponse> {
    return (await fetchWithAuth("/user")) as MembersResponse;
}

export async function getMemberLoansAction(userId: string): Promise<ActiveLoan[]> {
    return (await fetchWithAuth(`/user/${encodeURIComponent(userId)}/loans`)) as ActiveLoan[];
}
