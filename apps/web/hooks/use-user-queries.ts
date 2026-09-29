"use client";

import { changePassword, getCurrentUser, updateProfile } from "@/actions/user";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCurrentUser() {
    return useQuery({
        queryKey: queryKeys.auth.me,
        queryFn: getCurrentUser,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: { firstName?: string; lastName?: string; phone?: string } }) =>
            updateProfile(userId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
            queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
        },
    });
}

export function useChangePassword() {
    return useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: { currentPassword?: string; newPassword?: string } }) =>
            changePassword(userId, data),
    });
}
