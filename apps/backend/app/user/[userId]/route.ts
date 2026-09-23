import { updateProfileSchema } from "@/common/ZodSchema";
import { forbiddenResponse, isPrismaKnownError, unauthorizedResponse } from "@/lib/caller";
import prisma from "@/lib/db";
import { Prisma } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
    try {
        const { userId } = await params;
        const xUserId = request.headers.get("x-user-id");
        if (!xUserId) {
            return unauthorizedResponse();
        }
        if (xUserId !== userId) {
            return forbiddenResponse("You cannot update another member's profile");
        }

        const body = await request.json();
        const parsed = updateProfileSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
        }

        const updatedMember = await prisma.member.update({
            where: { id: userId },
            data: {
                ...(parsed.data.firstName && { firstName: parsed.data.firstName.trim() }),
                ...(parsed.data.lastName && { lastName: parsed.data.lastName.trim() }),
                ...(parsed.data.phone !== undefined && { phone: parsed.data.phone.trim() || null })
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                joinDate: true,
                isActive: true
            }
        });
        return NextResponse.json({ message: "Profile updated", member: updatedMember });
    } catch (error) {
        if (isPrismaKnownError(error, "P2002")) {
            return NextResponse.json({ error: "Unique constraint violation" }, { status: 409 });
        }
        console.error("PUT /user/[userId] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
    try {
        const xUserId = request.headers.get("x-user-id");
        if (!xUserId) {
            return unauthorizedResponse();
        }
        const { userId } = await params;
        const targetId = userId || xUserId;

        const member = await prisma.member.findUnique({
            where: { id: targetId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                joinDate: true,
                isActive: true,
                createdAt: true
            }
        });

        if (!member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        return NextResponse.json(member);
    } catch (error) {
        console.error("GET /user/[userId] error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
