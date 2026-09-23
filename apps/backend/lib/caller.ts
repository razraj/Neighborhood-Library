import { Prisma } from "@repo/db";
import { NextResponse } from "next/server";

export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse {
    return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message: string = "Forbidden"): NextResponse {
    return NextResponse.json({ error: message }, { status: 403 });
}

export function getCallerId(request: Request): string | null {
    return request.headers.get("x-user-id");
}

export function callerMustOwnResource(callerId: string | null, resourceOwnerId: string): NextResponse | null {
    if (!callerId) {
        return unauthorizedResponse();
    }
    if (callerId !== resourceOwnerId) {
        return forbiddenResponse("You are not permitted to access or modify this resource");
    }
    return null;
}

export function isPrismaKnownError(error: unknown, code: string): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
