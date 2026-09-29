import {
    borrowBookAction,
    createOrUpdateBookAction,
    getBookStatusAction,
    getMemberLoansAction,
    getMembersAction,
    returnBookAction
} from "@/actions/library";
import { queryKeys } from "@/lib/query-keys";
import { BorrowBookInput, CreateBookInput, ReturnBookInput, User } from "@/types";
import { fetchWithAuth } from "@/utils/api";
import { toast } from "@repo/ui/components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuthMeQuery() {
    return useQuery({
        queryKey: queryKeys.auth.me,
        queryFn: async () => {
            return (await fetchWithAuth("/auth/me")) as User;
        },
        staleTime: 5 * 60 * 1000,
        retry: 1
    });
}

export function useBookStatusQuery(bookId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.books.status(bookId),
        queryFn: () => getBookStatusAction(bookId),
        enabled: enabled && !!bookId && bookId.trim().length > 0,
        staleTime: 30 * 1000
    });
}

export function useUserLoansQuery(userId?: string) {
    return useQuery({
        queryKey: queryKeys.loans.user(userId || "me"),
        queryFn: async () => {
            if (!userId) return [];
            return await getMemberLoansAction(userId);
        },
        enabled: !!userId,
        staleTime: 15 * 1000
    });
}

export function useMembersQuery() {
    return useQuery({
        queryKey: queryKeys.members.all,
        queryFn: getMembersAction,
        staleTime: 60 * 1000
    });
}

export function useBorrowBookMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: BorrowBookInput) => borrowBookAction(input),
        onSuccess: (_data, variables) => {
            toast.success("Book successfully checked out!");
            queryClient.invalidateQueries({ queryKey: queryKeys.loans.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.books.status(variables.bookId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to borrow book");
        }
    });
}

export function useReturnBookMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: ReturnBookInput) => returnBookAction(input),
        onSuccess: () => {
            toast.success("Book returned successfully!");
            queryClient.invalidateQueries({ queryKey: queryKeys.loans.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to return book");
        }
    });
}

export function useCreateOrUpdateBookMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateBookInput) => createOrUpdateBookAction(input),
        onSuccess: (data) => {
            toast.success("Book saved successfully!");
            queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
            if (data?.bookId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.books.status(data.bookId) });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to save book");
        }
    });
}
