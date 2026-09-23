export { prisma } from "./client";

// Explicit re-exports only (no `export *`) — Turbopack rejects `export *` from Prisma’s generated CJS bundle.
export { Prisma, PrismaClient, CopyStatus } from "./generated/client";
export type { Author, Book, BookAuthor, Member, BookCopy, Loan } from "./generated/client";
