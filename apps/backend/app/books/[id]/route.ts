import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Update book metadata
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const bookId = params.id;
        const { title, isbn, publishedYear } = body;

        const updatedBook = await prisma.book.update({
            where: { bookId },
            data: { title, isbn, publishedYear }
        });

        return NextResponse.json(updatedBook);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
    }
}
