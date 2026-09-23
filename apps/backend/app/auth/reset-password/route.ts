import { resetPasswordSchema } from "@/common/ZodSchema";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const raw = await request.json();
        const parsed = resetPasswordSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
        }
        const { token, password } = parsed.data;

        const member = await prisma.member.findFirst({
            where: { resetToken: token.trim() },
            select: { id: true, resetTokenExp: true }
        });

        if (!member?.resetTokenExp || member.resetTokenExp.getTime() < Date.now()) {
            return NextResponse.json({ error: "Invalid or expired reset link. Request a new one." }, { status: 400 });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        await prisma.member.update({
            where: { id: member.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExp: null,
                refreshToken: null,
                refreshTokenExp: null
            }
        });

        return NextResponse.json({ message: "Your password has been updated. You can sign in now." });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
