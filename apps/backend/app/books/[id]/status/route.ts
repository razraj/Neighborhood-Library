import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const xUserId = request.headers.get("x-user-id");
        if (!xUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "Invalid book ID format." }, { status: 400 });
        }

        const book = await prisma.book.findUnique({
            where: { bookId: id },
            include: {
                authors: {
                    include: { author: true }
                },
                copies: {
                    include: {
                        // Fetch only the currently active loan for each copy
                        loans: {
                            where: { returnDate: null },
                            include: {
                                member: {
                                    select: { firstName: true, lastName: true, email: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!book) {
            return NextResponse.json({ error: "Book not found." }, { status: 404 });
        }

        // 1. Map the copies and calculate the overdue status
        const mappedCopies = book.copies.map((copy) => {
            const activeLoan = copy.loans[0];

            return {
                copyId: copy.copyId,
                status: copy.status,
                ...(activeLoan && {
                    currentBorrower: `${activeLoan.member.firstName} ${activeLoan.member.lastName}`,
                    borrowerEmail: activeLoan.member.email,
                    borrowDate: activeLoan.borrowDate,
                    dueDate: activeLoan.dueDate,
                    isOverdue: new Date() > activeLoan.dueDate
                })
            };
        });

        // 2. Sort the copies: Overdue first, then currently borrowed, then available
        const sortedCopies = mappedCopies.sort((a, b) => {
            // Overdue copies bubble to the top
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;

            // If both are overdue (or neither), prioritize sorting by nearest due date
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }

            // Secondary sort: push 'borrowed' items above 'available' items
            if (a.status === "borrowed" && b.status !== "borrowed") return -1;
            if (a.status !== "borrowed" && b.status === "borrowed") return 1;

            return 0;
        });

        const statusReport = {
            bookId: book.bookId,
            title: book.title,
            isbn: book.isbn,
            authors: book.authors.map((a) => `${a.author.firstName} ${a.author.lastName}`),
            inventorySummary: {
                total: book.copies.length,
                available: book.copies.filter((c) => c.status === "available").length,
                borrowed: book.copies.filter((c) => c.status === "borrowed").length,
                maintenance: book.copies.filter((c) => c.status === "maintenance").length,
                lost: book.copies.filter((c) => c.status === "lost").length
            },
            copies: sortedCopies // Attach the newly sorted array
        };

        return NextResponse.json(statusReport, { status: 200 });
    } catch (error) {
        console.error("Error fetching book status:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred while fetching book status." },
            { status: 500 }
        );
    }
}
