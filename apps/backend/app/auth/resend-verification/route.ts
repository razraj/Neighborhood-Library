import { resendVerificationSchema } from "@/common/ZodSchema";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const raw = await request.json();
        const parsed = resendVerificationSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }
        const { email } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        const member = await prisma.member.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, isActive: true }
        });

        if (member && !member.isActive) {
            await prisma.member.update({
                where: { id: member.id },
                data: { isActive: true }
            });
        }

        return NextResponse.json({ message: "If an account exists, verification instructions have been sent." });
    } catch (error) {
        console.error("Resend verification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
