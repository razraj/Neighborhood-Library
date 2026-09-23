import { borrowBookSchema } from "@/common/ZodSchema";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

// Record when a member borrows a book
export async function POST(request: Request): Promise<NextResponse> {
    try {
        const raw = await request.json();
        const parsed = borrowBookSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
        }
        const { memberId, copyId, daysToBorrow } = parsed.data;

        // Verify the copy is actually available
        const copy = await prisma.bookCopy.findUnique({ where: { copyId } });
        if (!copy || copy.status !== "available") {
            return NextResponse.json({ error: "Book copy is not available" }, { status: 400 });
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysToBorrow);

        const [loan, updatedCopy] = await prisma.$transaction([
            prisma.loan.create({
                data: { copyId, memberId, dueDate }
            }),
            prisma.bookCopy.update({
                where: { copyId },
                data: { status: "borrowed" }
            })
        ]);

        return NextResponse.json({ loan, updatedCopy });
    } catch (error) {
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
}
