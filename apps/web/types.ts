export type CopyStatus = "available" | "borrowed" | "lost" | "maintenance";

export interface Member {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    joinDate?: string;
    isActive: boolean;
}

export interface MembersResponse {
    members: Member[];
    total: number;
}

export interface BookCopy {
    copyId: string;
    status: CopyStatus;
    currentBorrower?: string;
    borrowerEmail?: string;
    borrowDate?: string;
    dueDate?: string;
    isOverdue?: boolean;
}

export interface InventorySummary {
    total: number;
    available: number;
    borrowed: number;
    maintenance: number;
    lost: number;
}

export interface BookStatusReport {
    bookId: string;
    title: string;
    isbn?: string | null;
    authors: string[];
    inventorySummary: InventorySummary;
    copies: BookCopy[];
}

export interface ActiveLoan {
    loanId: string;
    bookTitle: string;
    copyId: string;
    borrowDate: string;
    dueDate: string;
    isOverdue: boolean;
    returnDate: string | null;
}

export interface CreateBookInput {
    title: string;
    isbn?: string;
    publishedYear?: number;
    numberOfCopies: number;
    authorId?: string;
    authorFirstName?: string;
    authorLastName?: string;
}

export interface UpdateBookInput {
    title?: string;
    isbn?: string;
    publishedYear?: number;
}

export interface BorrowBookInput {
    bookId: string;
    daysToBorrow: number;
}

export interface ReturnBookInput {
    loanId: string;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    isActive?: boolean;
    joinDate?: string;
}
