import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const xUserId = request.headers.get("x-user-id");
        if (!xUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const members = await prisma.member.findMany({
            where: { isActive: true },
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
        return NextResponse.json({
            members,
            total: members.length
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
