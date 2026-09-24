export const queryKeys = {
    auth: {
        me: ["auth", "me"] as const,
    },
    books: {
        all: ["books"] as const,
        status: (bookId: string) => ["books", "status", bookId] as const,
    },
    loans: {
        all: ["loans"] as const,
        user: (userId: string) => ["loans", "user", userId] as const,
    },
    members: {
        all: ["members"] as const,
        detail: (userId: string) => ["members", "detail", userId] as const,
        loans: (userId: string) => ["members", "loans", userId] as const,
    },
} as const;
