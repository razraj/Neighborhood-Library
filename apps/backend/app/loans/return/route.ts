import { forbiddenResponse, unauthorizedResponse } from "@/lib/caller";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

// Record when a borrowed book is returned
export async function POST(request: Request): Promise<NextResponse> {
    try {
        const xUserId = request.headers.get("x-user-id");
        if (!xUserId) {
            return unauthorizedResponse("Authentication required to return a book");
        }

        const body = await request.json();
        const loanId = body?.loanId;
        if (!loanId || typeof loanId !== "string") {
            return NextResponse.json({ error: "Invalid loanId" }, { status: 400 });
        }

        const existingLoan = await prisma.loan.findUnique({ where: { loanId } });
        if (!existingLoan || existingLoan.returnDate) {
            return NextResponse.json({ error: "Invalid loan or book has already been returned" }, { status: 400 });
        }

        if (existingLoan.memberId !== xUserId) {
            return forbiddenResponse("You can only return books checked out on your own account");
        }

        const [loan, updatedCopy] = await prisma.$transaction([
            prisma.loan.update({
                where: { loanId },
                data: { returnDate: new Date() }
            }),
            prisma.bookCopy.update({
                where: { copyId: existingLoan.copyId },
                data: { status: "available" }
            })
        ]);

        return NextResponse.json({ loan, updatedCopy });
    } catch (error) {
        console.error("Return error:", error);
        return NextResponse.json({ error: "Return process failed" }, { status: 500 });
    }
}
