import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./utils/auth";

/**
 * Get auth_token from cookie header (value may contain "=" so we don't use split("=")[1])
 */
function getAuthTokenFromCookie(cookieHeader: string | null): string | undefined {
    if (!cookieHeader) return undefined;
    const authCookie = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("auth_token="));
    if (!authCookie) return undefined;
    return authCookie.slice("auth_token=".length).trim();
}

const configuredAllowedHosts = process.env.ALLOWED_HOSTS
    ? process.env.ALLOWED_HOSTS.split(",").map((h) => h.trim())
    : [
          "localhost:3000",
          "localhost:3001",
          "127.0.0.1:3000",
          "127.0.0.1:3001"
      ];

function isOriginAllowed(origin: string): boolean {
    if (!origin) return false;
    try {
        const parsed = new URL(origin);
        return configuredAllowedHosts.some((host) => host === parsed.host);
    } catch {
        return false;
    }
}

export default async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const host = request.headers.get("host") ?? request.nextUrl.host;
    const origin = request.headers.get("origin") ?? "";

    // Host header check
    if (host && process.env.NODE_ENV === "production" && !configuredAllowedHosts.includes(host)) {
        return NextResponse.json({ error: "Invalid host header" }, { status: 403 });
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        const preflightResponse = new NextResponse(null, { status: 204 });
        if (isOriginAllowed(origin)) {
            preflightResponse.headers.set("Access-Control-Allow-Origin", origin);
            preflightResponse.headers.set("Access-Control-Allow-Credentials", "true");
            preflightResponse.headers.set(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            );
            preflightResponse.headers.set(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, x-user-id"
            );
        }
        return preflightResponse;
    }

    const publicAuthPaths = new Set([
        "/",
        "/auth/login",
        "/auth/signup",
        "/auth/verify-email",
        "/auth/resend-verification",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/auth/refresh"
    ]);

    function isPublicPath(path: string): boolean {
        if (publicAuthPaths.has(path)) return true;
        if (path.startsWith("/webhooks/") || path.startsWith("/queues/")) return true;
        return false;
    }

    const allowOriginHeader = isOriginAllowed(origin) ? origin : null;

    if (isPublicPath(pathname)) {
        const response = NextResponse.next();
        if (allowOriginHeader) {
            response.headers.set("Access-Control-Allow-Origin", allowOriginHeader);
            response.headers.set("Access-Control-Allow-Credentials", "true");
        }
        return response;
    }

    const token = getAuthTokenFromCookie(request.headers.get("cookie"));
    if (!token) {
        const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (allowOriginHeader) {
            response.headers.set("Access-Control-Allow-Origin", allowOriginHeader);
            response.headers.set("Access-Control-Allow-Credentials", "true");
        }
        return response;
    }

    const payload = await verifyToken(token);
    if (!payload?.sub) {
        const response = NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
        if (allowOriginHeader) {
            response.headers.set("Access-Control-Allow-Origin", allowOriginHeader);
            response.headers.set("Access-Control-Allow-Credentials", "true");
        }
        return response;
    }

    const userId = payload.sub;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", userId);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders
        }
    });

    if (allowOriginHeader) {
        response.headers.set("Access-Control-Allow-Origin", allowOriginHeader);
        response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
