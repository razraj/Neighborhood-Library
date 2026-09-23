import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse } from "@/lib/caller";
import { loginUserSelect } from "@/lib/auth-session";

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const userId = req.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ message: "User not found" }, { status: 401 });
        }
        const user = await prisma.member.findUnique({
            where: { id: userId },
            select: loginUserSelect,
        });

        if (!user) {
            return unauthorizedResponse();
        }

        return NextResponse.json({ ...user }, { status: 200 });
    } catch (error) {
        console.error("GET /auth/me error:", error);
        return NextResponse.json({ message: "Error fetching user" }, { status: 500 });
    }
}
