import prisma from "@/lib/db";
import "dotenv/config";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

export const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET!);

/** Access JWT lifetime and `auth_token` cookie max-age (seconds). */
export const AUTH_ACCESS_TOKEN_MAX_AGE_SEC = 60 * 60 * 2; //2hours
export const REFRESH_TOKEN_MAX_AGE_SEC = 60 * 60 * 24; //1day - 24hours

export const loginUserSelect = {
    id: true,
    email: true,
    password: true,
    firstName: true,
    lastName: true,
    joinDate: true,
    isActive: true,
    refreshToken: true,
    refreshTokenExp: true
} as const;

export async function generateToken(userId: string) {
    const token = await new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(`${AUTH_ACCESS_TOKEN_MAX_AGE_SEC}s`)
        .sign(SECRET_KEY);

    const refreshToken = await new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(`${REFRESH_TOKEN_MAX_AGE_SEC}s`)
        .sign(SECRET_KEY);

    return { token, refreshToken };
}

export function setAuthCookiesOnResponse(response: NextResponse, token: string, refreshToken: string) {
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set("auth_token", token, {
        httpOnly: true,
        sameSite: "strict",
        secure,
        maxAge: AUTH_ACCESS_TOKEN_MAX_AGE_SEC,
        path: "/"
    });
    response.cookies.set("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure,
        maxAge: REFRESH_TOKEN_MAX_AGE_SEC,
        path: "/api/auth/refresh"
    });
}

export async function completeLoginForUserId(userId: string) {
    const user = await prisma.member.findUniqueOrThrow({
        where: { id: userId },
        select: loginUserSelect
    });
    const { token, refreshToken } = await generateToken(userId);
    await prisma.member.update({
        where: { id: userId },
        data: {
            refreshToken,
            refreshTokenExp: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_SEC * 1000)

        }
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit password from JSON
    const { password, ...userWithoutPassword } = user;
    const response = NextResponse.json({
        ...userWithoutPassword,
        authToken: token,
        refreshToken,
    });
    setAuthCookiesOnResponse(response, token, refreshToken);
    return response;
}
