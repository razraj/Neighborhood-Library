import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Record when a borrowed book is returned
export async function POST(request: Request): Promise<NextResponse> {
    try {
        const { loanId } = await request.json();

        const existingLoan = await prisma.loan.findUnique({ where: { loanId } });
        if (!existingLoan || existingLoan.returnDate) {
            return NextResponse.json({ error: "Invalid loan or already returned" }, { status: 400 });
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
        return NextResponse.json({ error: "Return process failed" }, { status: 500 });
    }
}
