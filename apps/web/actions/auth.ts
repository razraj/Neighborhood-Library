import { User } from "@/types";
import { fetchWithoutAuth } from "@/utils/api";
import { getSanitizedRedirectPath } from "@/utils/url";
import { toast } from "@repo/ui/components";
import { clearUserFromLocalStorage } from "./auth-check";

export async function login(usernameOrEmail: string, password: string, redirectTo = "/dashboard"): Promise<User> {
    const data = (await fetchWithoutAuth("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameOrEmail, password }),
        credentials: "include"
    })) as User;

    if (!data.id) {
        throw new Error("Invalid credentials");
    }

    localStorage.setItem("user", JSON.stringify(data));
    toast.success("Logged in successfully");
    const destination = getSanitizedRedirectPath(redirectTo);
    window?.location?.replace?.(destination === "/" ? "/dashboard" : destination);
    return data;
}

export interface SignupPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

export async function signup(payload: SignupPayload, redirectTo = "/dashboard"): Promise<User> {
    const data = (await fetchWithoutAuth("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
    })) as User;

    if (data && data.id) {
        localStorage.setItem("user", JSON.stringify(data));
        toast.success("Account created successfully");
        const destination = getSanitizedRedirectPath(redirectTo);
        window?.location?.replace?.(destination === "/" ? "/dashboard" : destination);
    }
    return data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
    return (await fetchWithoutAuth("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    })) as { message: string };
}

export async function logout(): Promise<void> {
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });
    } catch (error) {
        console.error("Logout error:", error);
    } finally {
        await clearUserFromLocalStorage();
        window?.location?.replace?.("/login");
    }
}
