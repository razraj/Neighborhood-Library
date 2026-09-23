import { signupRequestSchema } from "@/common/ZodSchema";
import { completeLoginForUserId } from "@/lib/auth-session";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const raw = await request.json();
        const parsed = signupRequestSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
        }
        const { email, password, firstName, lastName, phone } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        const existingMember = await prisma.member.findUnique({
            where: { email: normalizedEmail },
            select: { id: true }
        });

        if (existingMember) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newMember = await prisma.member.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone?.trim() || null
            },
            select: { id: true }
        });

        return completeLoginForUserId(newMember.id);
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
