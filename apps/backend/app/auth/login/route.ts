import { loginRequestSchema } from "@/common/ZodSchema";
import { completeLoginForUserId } from "@/lib/auth-session";
import prisma from "@/lib/db";
import { isEmail } from "@/utils/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const raw = await request.json();
        const parsed = loginRequestSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        const { username, password } = parsed.data;

        const emailCheck = isEmail(username);
        const whereClause = emailCheck ? { email: username.toLowerCase().trim() } : { id: username };

        const member = await prisma.member.findUnique({
            where: whereClause,
            select: {
                id: true,
                password: true,
                isActive: true
            }
        });

        if (!member?.password || !bcrypt.compareSync(password, member.password)) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        if (!member.isActive) {
            return NextResponse.json(
                { error: "Account is inactive. Please contact the library administrator.", code: "ACCOUNT_INACTIVE" },
                { status: 403 }
            );
        }

        return completeLoginForUserId(member.id);
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
