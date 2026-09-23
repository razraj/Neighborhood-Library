import { borrowBookSchema } from "@/common/ZodSchema";
import { unauthorizedResponse } from "@/lib/caller";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

// Record when a member borrows a book.
// Caller supplies a bookId; memberId is derived from the authenticated x-user-id header.
export async function POST(request: Request): Promise<NextResponse> {
    try {
        const xUserId = request.headers.get("x-user-id");
        if (!xUserId) {
            return unauthorizedResponse("Authentication required to borrow a book");
        }

        const raw = await request.json();
        const parsed = borrowBookSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request", details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const { bookId, daysToBorrow } = parsed.data;

        // Confirm the book exists
        const book = await prisma.book.findUnique({ where: { bookId } });
        if (!book) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        // Find the first available copy for this book
        const availableCopy = await prisma.bookCopy.findFirst({
            where: { bookId, status: "available" }
        });
        if (!availableCopy) {
            return NextResponse.json(
                { error: "No copies available for this book" },
                { status: 409 }
            );
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysToBorrow);

        const [loan, updatedCopy] = await prisma.$transaction([
            prisma.loan.create({
                data: {
                    copyId: availableCopy.copyId,
                    memberId: xUserId,
                    dueDate
                }
            }),
            prisma.bookCopy.update({
                where: { copyId: availableCopy.copyId },
                data: { status: "borrowed" }
            })
        ]);

        return NextResponse.json({ loan, updatedCopy });
    } catch (error) {
        console.error("Borrow error:", error);
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
}
