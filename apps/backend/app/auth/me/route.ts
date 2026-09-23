import { meUserSelect } from "@/lib/auth-session";
import { unauthorizedResponse } from "@/lib/caller";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const userId = req.headers.get("x-user-id");
        if (!userId) {
            return unauthorizedResponse("User not found or unauthenticated");
        }
        const user = await prisma.member.findUnique({
            where: { id: userId },
            select: meUserSelect
        });

        if (!user) {
            return unauthorizedResponse("User not found");
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error("GET /auth/me error:", error);
        return NextResponse.json({ error: "Error fetching user profile" }, { status: 500 });
    }
}
