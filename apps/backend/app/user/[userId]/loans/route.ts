import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// List all active borrowed books for a specific member
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
    try {
        const xUserId = request.headers.get("x-user-id");
        if (!xUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { userId } = await params;

        const activeLoans = await prisma.loan.findMany({
            where: {
                memberId: userId ?? xUserId, //If userId is not provided, fetch loans for the logged in user
                returnDate: null // Only fetch books that are currently checked out
            },
            include: {
                copy: {
                    include: {
                        book: true // Includes the book title and ISBN
                    }
                }
            },
            orderBy: { dueDate: "asc" }
        });

        const response = activeLoans.map((loan) => ({
            loanId: loan.loanId,
            bookTitle: loan.copy.book.title,
            copyId: loan.copyId,
            borrowDate: loan.borrowDate,
            dueDate: loan.dueDate,
            isOverdue: new Date() > loan.dueDate,
            returnDate: loan.returnDate
        }));

        return NextResponse.json(response);
    } catch (error) {
        console.error("GET /user/[userId]/loans error:", error);
        return NextResponse.json({ error: "Failed to fetch active loans" }, { status: 500 });
    }
}
