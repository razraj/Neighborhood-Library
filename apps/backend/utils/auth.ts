import { jwtVerify } from "jose";

const jwtSecretString = process.env.JWT_SECRET || "default_jwt_secret_key_change_in_production";
const SECRET_KEY = new TextEncoder().encode(jwtSecretString);

export const backendUrl =
    process.env.NODE_ENV === "production"
        ? `https://${process.env.DATABASE_HOST?.replace(/\/$/, "")}`
        : "http://localhost:3000";

/** Public web app origin for links in emails (reset password, etc.). */
export const webUrl =
    process.env.WEB_URL?.replace(/\/$/, "") ??
    (process.env.NODE_ENV === "production"
        ? `https://${process.env.WEB_APP_HOST?.replace(/\/$/, "") ?? "neighborhood-library.vercel.app"}`
        : "http://localhost:3001");

export function isEmail(username: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(username);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch {
        return null;
    }
}
