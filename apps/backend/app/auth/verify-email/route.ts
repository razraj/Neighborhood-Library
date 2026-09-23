import prisma from "@/lib/db";
import { completeLoginForUserId } from "@/lib/auth-session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get("token");
        if (!token?.trim()) {
            return NextResponse.json({ error: "Missing token" }, { status: 400 });
        }

        // Search for member matching reset/verification token if applicable
        const member = await prisma.member.findFirst({
            where: { resetToken: token.trim() },
            select: { id: true, isActive: true }
        });

        if (!member) {
            return NextResponse.json({ message: "Verification completed or expired. You may sign in." });
        }

        if (!member.isActive) {
            await prisma.member.update({
                where: { id: member.id },
                data: { isActive: true }
            });
        }

        return completeLoginForUserId(member.id);
    } catch (error) {
        console.error("Verify email error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
