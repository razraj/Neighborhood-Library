import { Member, MembersResponse, User } from "@/types";
import { fetchWithAuth } from "@/utils/api";

export const getUsers = async (): Promise<MembersResponse> =>
    fetchWithAuth(`/user`, { method: "GET" }) as Promise<MembersResponse>;

export const getCurrentUser = (): Promise<User> =>
    fetchWithAuth(`/auth/me`, { method: "GET" }) as Promise<User>;

export const updateProfile = (
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string }
): Promise<Member> =>
    fetchWithAuth(`/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }) as Promise<Member>;

export const changePassword = (
    userId: string,
    data: { oldPassword?: string; currentPassword?: string; newPassword?: string; password?: string }
): Promise<{ message?: string }> =>
    fetchWithAuth(`/user/${userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }) as Promise<{ message?: string }>;
