import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Update book metadata
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json();
        const { id: bookId } = await params;
        const { title, isbn, publishedYear } = body;

        const updatedBook = await prisma.book.update({
            where: { bookId },
            data: {
                ...(title !== undefined && { title }),
                ...(isbn !== undefined && { isbn }),
                ...(publishedYear !== undefined && { publishedYear: publishedYear ? Number(publishedYear) : null })
            }
        });

        return NextResponse.json(updatedBook);
    } catch (error) {
        console.error("PUT /books/[id] error:", error);
        return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
    }
}
