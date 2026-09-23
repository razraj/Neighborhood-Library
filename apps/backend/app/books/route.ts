import { updateBookSchema } from "@/common/ZodSchema";
import prisma from "@/lib/db";
import { Prisma } from "@repo/db";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const raw = await request.json();
        const parsed = updateBookSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
        }
        const { title, isbn, publishedYear, numberOfCopies, authorId, authorFirstName, authorLastName } = parsed.data;

        let targetAuthorId = authorId;

        if (!targetAuthorId) {
            const firstName = authorFirstName;
            const lastName = authorLastName;

            const existingAuthor = await prisma.author.findFirst({
                where: { firstName, lastName }
            });

            if (existingAuthor) {
                targetAuthorId = existingAuthor.authorId;
            } else {
                const newAuthor = await prisma.author.create({
                    data: { firstName, lastName }
                });
                targetAuthorId = newAuthor.authorId;
            }
        }

        const book = await prisma.$transaction(async (tx) => {
            const existingBook = await tx.book.findUnique({
                where: { isbn },
                include: { copies: true, authors: true }
            });

            if (!existingBook) {
                return tx.book.create({
                    data: {
                        title,
                        isbn,
                        publishedYear: publishedYear ? Number(publishedYear) : null,
                        authors: {
                            create: [{ authorId: targetAuthorId }]
                        },
                        copies: {
                            create: Array.from({ length: numberOfCopies }).map(() => ({
                                status: "available"
                            }))
                        }
                    },
                    include: {
                        authors: {
                            include: { author: true }
                        },
                        copies: true
                    }
                });
            }

            // Update existing book:
            // 1. Author association
            const isAlreadyLinked = existingBook.authors.some((a) => a.authorId === targetAuthorId);
            if (!isAlreadyLinked) {
                await tx.bookAuthor.deleteMany({
                    where: { bookId: existingBook.bookId }
                });
                await tx.bookAuthor.create({
                    data: {
                        bookId: existingBook.bookId,
                        authorId: targetAuthorId
                    }
                });
            }

            // 2. Copies management
            const currentCopiesCount = existingBook.copies.length;
            const diff = numberOfCopies - currentCopiesCount;

            if (diff > 0) {
                // Increase copies: create new copies with 'available' status
                await tx.bookCopy.createMany({
                    data: Array.from({ length: diff }).map(() => ({
                        bookId: existingBook.bookId,
                        status: "available"
                    }))
                });
            } else if (diff < 0) {
                // Reduce copies: only delete copies that have status 'available'
                const copiesToRemoveCount = Math.abs(diff);
                const availableCopies = existingBook.copies.filter((copy) => copy.status === "available");

                if (availableCopies.length < copiesToRemoveCount) {
                    throw new Error(
                        `Cannot reduce to ${numberOfCopies} copies: only ${availableCopies.length} copy(ies) are currently 'available', but ${copiesToRemoveCount} copy(ies) need to be removed. Remaining copies may be borrowed, lost, or under maintenance.`
                    );
                }

                const copiesToDelete = availableCopies.slice(0, copiesToRemoveCount);
                const copyIdsToDelete = copiesToDelete.map((c) => c.copyId);

                await tx.bookCopy.deleteMany({
                    where: {
                        copyId: { in: copyIdsToDelete }
                    }
                });
            }

            // 3. Update book core fields
            return tx.book.update({
                where: { bookId: existingBook.bookId },
                data: {
                    title,
                    publishedYear: publishedYear ? Number(publishedYear) : null
                },
                include: {
                    authors: {
                        include: { author: true }
                    },
                    copies: true
                }
            });
        });

        return NextResponse.json(book, { status: 200 });
    } catch (error: unknown) {
        console.error("Book route error:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") {
                return NextResponse.json(
                    { error: "Cannot delete copies with associated loan history due to database constraints." },
                    { status: 400 }
                );
            }
            return NextResponse.json({ error: `Database error (${error.code}): ${error.message}` }, { status: 400 });
        }
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ error: "Failed to process book request" }, { status: 500 });
    }
}
