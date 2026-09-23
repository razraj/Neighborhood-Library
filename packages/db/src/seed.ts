import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma, type CopyStatus } from "./index.js";

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD ?? "password123";

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

async function upsertAuthor(firstName: string, lastName: string, authorId?: string) {
    const existing = await prisma.author.findFirst({
        where: { firstName, lastName }
    });
    if (existing) {
        return existing;
    }
    return prisma.author.create({ data: { firstName, lastName, authorId } });
}

async function upsertBook(data: {
    title: string;
    isbn: string;
    publishedYear: number;
    authorIds: string[];
}) {
    const book = await prisma.book.upsert({
        where: { isbn: data.isbn },
        create: {
            title: data.title,
            isbn: data.isbn,
            publishedYear: data.publishedYear
        },
        update: {
            title: data.title,
            publishedYear: data.publishedYear
        }
    });

    for (const authorId of data.authorIds) {
        await prisma.bookAuthor.upsert({
            where: {
                bookId_authorId: { bookId: book.bookId, authorId }
            },
            create: { bookId: book.bookId, authorId },
            update: {}
        });
    }

    return book;
}

async function ensureCopy(bookId: string, status: CopyStatus) {
    const existing = await prisma.bookCopy.findFirst({
        where: { bookId, status }
    });
    if (existing) {
        return existing;
    }
    return prisma.bookCopy.create({ data: { bookId, status } });
}

async function ensureLoan(data: {
    copyId: string;
    memberId: string;
    borrowDate: Date;
    dueDate: Date;
    returnDate: Date | null;
}) {
    const existing = await prisma.loan.findFirst({
        where: {
            copyId: data.copyId,
            memberId: data.memberId,
            borrowDate: data.borrowDate
        }
    });
    if (existing) {
        return prisma.loan.update({
            where: { loanId: existing.loanId },
            data: {
                dueDate: data.dueDate,
                returnDate: data.returnDate
            }
        });
    }
    return prisma.loan.create({ data });
}

async function main() {
    console.log("Seeding library database with comprehensive test data...");

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // 1. Seed Members (Active and Inactive)
    const memberAlice = await prisma.member.upsert({
        where: { email: "alice.smith@example.com" },
        create: {
            firstName: "Alice",
            lastName: "Smith",
            email: "alice.smith@example.com",
            password: hashedPassword,
            phone: "555-0101",
            isActive: true
        },
        update: {
            firstName: "Alice",
            lastName: "Smith",
            phone: "555-0101",
            password: hashedPassword,
            isActive: true
        }
    });

    const memberBob = await prisma.member.upsert({
        where: { email: "bob.jones@example.com" },
        create: {
            firstName: "Bob",
            lastName: "Jones",
            email: "bob.jones@example.com",
            password: hashedPassword,
            phone: "555-0102",
            isActive: true
        },
        update: {
            firstName: "Bob",
            lastName: "Jones",
            phone: "555-0102",
            password: hashedPassword,
            isActive: true
        }
    });

    const memberCharlie = await prisma.member.upsert({
        where: { email: "charlie.brown@example.com" },
        create: {
            firstName: "Charlie",
            lastName: "Brown",
            email: "charlie.brown@example.com",
            password: hashedPassword,
            phone: "555-0103",
            isActive: true
        },
        update: {
            firstName: "Charlie",
            lastName: "Brown",
            phone: "555-0103",
            password: hashedPassword,
            isActive: true
        }
    });

    const memberDiana = await prisma.member.upsert({
        where: { email: "diana.prince@example.com" },
        create: {
            firstName: "Diana",
            lastName: "Prince",
            email: "diana.prince@example.com",
            password: hashedPassword,
            phone: "555-0104",
            isActive: false
        },
        update: {
            firstName: "Diana",
            lastName: "Prince",
            phone: "555-0104",
            password: hashedPassword,
            isActive: false
        }
    });

    console.log(
        `Upserted 4 members: ${memberAlice.email}, ${memberBob.email}, ${memberCharlie.email}, ${memberDiana.email}`
    );

    // 2. Seed Authors (6 Authors)
    const authorOrwell = await upsertAuthor("George", "Orwell");
    const authorTolkien = await upsertAuthor("J.R.R.", "Tolkien");
    const authorAusten = await upsertAuthor("Jane", "Austen");
    const authorAsimov = await upsertAuthor("Isaac", "Asimov");
    const authorGaiman = await upsertAuthor("Neil", "Gaiman");
    const authorPratchett = await upsertAuthor("Terry", "Pratchett");

    console.log("Upserted 6 authors (Orwell, Tolkien, Austen, Asimov, Gaiman, Pratchett).");

    // 3. Seed Books (5 Books, including single and multi-author)
    const book1984 = await upsertBook({
        title: "1984",
        isbn: "978-0451524935",
        publishedYear: 1949,
        authorIds: [authorOrwell.authorId]
    });

    const bookHobbit = await upsertBook({
        title: "The Hobbit",
        isbn: "978-0547928227",
        publishedYear: 1937,
        authorIds: [authorTolkien.authorId]
    });

    const bookPride = await upsertBook({
        title: "Pride and Prejudice",
        isbn: "978-0141439518",
        publishedYear: 1813,
        authorIds: [authorAusten.authorId]
    });

    const bookFoundation = await upsertBook({
        title: "Foundation",
        isbn: "978-0553293357",
        publishedYear: 1951,
        authorIds: [authorAsimov.authorId]
    });

    const bookGoodOmens = await upsertBook({
        title: "Good Omens",
        isbn: "978-0060853983",
        publishedYear: 1990,
        authorIds: [authorGaiman.authorId, authorPratchett.authorId]
    });

    console.log(
        `Upserted 5 books: ${book1984.title}, ${bookHobbit.title}, ${bookPride.title}, ${bookFoundation.title}, ${bookGoodOmens.title}`
    );

    // 4. Seed Copies with ALL CopyStatus enum combinations (available, borrowed, lost, maintenance)
    const copy1984_borrowed = await ensureCopy(book1984.bookId, "borrowed");
    const copy1984_available = await ensureCopy(book1984.bookId, "available");
    const copy1984_lost = await ensureCopy(book1984.bookId, "lost");

    const copyHobbit1 = await ensureCopy(bookHobbit.bookId, "available");
    const copyHobbit2 = await ensureCopy(bookHobbit.bookId, "borrowed");

    const copyPride1 = await ensureCopy(bookPride.bookId, "available");
    const copyPride2 = await ensureCopy(bookPride.bookId, "borrowed");

    const copyFoundation1 = await ensureCopy(bookFoundation.bookId, "available");
    const copyFoundation2 = await ensureCopy(bookFoundation.bookId, "maintenance");

    const copyGoodOmens1 = await ensureCopy(bookGoodOmens.bookId, "available");
    const copyGoodOmens2 = await ensureCopy(bookGoodOmens.bookId, "borrowed");

    console.log("Ensured copies with all CopyStatus states (available, borrowed, lost, maintenance).");

    // 5. Seed Loans covering all loan status combinations:
    // - Active on-time loan
    // - Active overdue loan
    // - Completed on-time return
    // - Completed late return
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Loan 1: Alice - Active regular loan (borrowed 5 days ago, due in 9 days)
    await ensureLoan({
        copyId: copy1984_borrowed.copyId,
        memberId: memberAlice.id,
        borrowDate: addDays(today, -5),
        dueDate: addDays(today, 9),
        returnDate: null
    });

    // Loan 2: Bob - Completed on-time return (borrowed 20 days ago, due 6 days ago, returned 10 days ago)
    await ensureLoan({
        copyId: copyHobbit1.copyId,
        memberId: memberBob.id,
        borrowDate: addDays(today, -20),
        dueDate: addDays(today, -6),
        returnDate: addDays(today, -10)
    });

    // Loan 3: Charlie - Active OVERDUE loan (borrowed 30 days ago, due 10 days ago, not yet returned)
    await ensureLoan({
        copyId: copyHobbit2.copyId,
        memberId: memberCharlie.id,
        borrowDate: addDays(today, -30),
        dueDate: addDays(today, -10),
        returnDate: null
    });

    // Loan 4: Alice - Completed LATE return (borrowed 40 days ago, due 25 days ago, returned 20 days ago)
    await ensureLoan({
        copyId: copyPride1.copyId,
        memberId: memberAlice.id,
        borrowDate: addDays(today, -40),
        dueDate: addDays(today, -25),
        returnDate: addDays(today, -20)
    });

    // Loan 5: Bob - Active regular loan
    await ensureLoan({
        copyId: copyPride2.copyId,
        memberId: memberBob.id,
        borrowDate: addDays(today, -2),
        dueDate: addDays(today, 12),
        returnDate: null
    });

    // Loan 6: Charlie - Active regular loan
    await ensureLoan({
        copyId: copyGoodOmens2.copyId,
        memberId: memberCharlie.id,
        borrowDate: addDays(today, -1),
        dueDate: addDays(today, 13),
        returnDate: null
    });

    console.log("Ensured comprehensive loan records (Active on-time, Active overdue, Returned on-time, Returned late).");

    const [memberCount, bookCount, authorCount, copyCount, activeLoans, completedLoans] = await Promise.all([
        prisma.member.count(),
        prisma.book.count(),
        prisma.author.count(),
        prisma.bookCopy.count(),
        prisma.loan.count({ where: { returnDate: null } }),
        prisma.loan.count({ where: { returnDate: { not: null } } })
    ]);

    console.log("\n============= Library Database Status =============");
    console.log(`  Members:         ${memberCount}`);
    console.log(`  Authors:         ${authorCount}`);
    console.log(`  Books:           ${bookCount}`);
    console.log(`  Physical Copies: ${copyCount}`);
    console.log(`  Active Loans:    ${activeLoans}`);
    console.log(`  Completed Loans: ${completedLoans}`);
    console.log("===================================================\n");
    console.log("Database seed completed successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
