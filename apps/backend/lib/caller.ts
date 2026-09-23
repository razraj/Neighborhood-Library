import prisma from "@/lib/db";
import { Prisma } from "@repo/db";
import { NextResponse } from "next/server";

export type Caller = {
    id: string;
};

export async function getCaller(callerId: string | null): Promise<Caller | null> {
    if (!callerId) return null;
    return prisma.member.findUnique({
        where: { id: callerId },
        select: { id: true }
    });
}

export function unauthorizedResponse(): NextResponse {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse(): NextResponse {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}

export function bookListWhere(callerId: string): Prisma.BookWhereInput {
    const where: Prisma.BookWhereInput = {
        bookId: callerId
    };
    return where;
}

export function borrowerListWhere(callerId: string): Prisma.LoanWhereInput {
    const where: Prisma.LoanWhereInput = {
        memberId: callerId
    };
    return where;
}

export function isPrismaKnownError(error: unknown, code: string): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
