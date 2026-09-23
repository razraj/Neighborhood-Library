import { z } from "zod";

export const loginRequestSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(6)
});

export const signupRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().optional()
});

export const forgotPasswordRequestSchema = z.object({
    email: z.string().email()
});

export const resendVerificationSchema = z.object({
    email: z.string().email()
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8)
});

const isoYearSchema = z.string().regex(/^\d{4}$/, "Expected a 4-digit year");

export const updateBookSchema = z.object({
    title: z.string().min(1),
    isbn: z.string().min(1),
    publishedYear: isoYearSchema.optional(),
    numberOfCopies: z.coerce.number().int().min(1).default(1),
    authorId: z.string().optional(),
    authorFirstName: z.string().default("unknown"),
    authorLastName: z.string().default("unknown")
});

export const borrowBookSchema = z.object({
    bookId: z.string().min(1),
    daysToBorrow: z.coerce.number().int().min(1).default(14)
});

export const updateProfileSchema = z
    .object({
        firstName: z.string().min(1, "First name is required").optional(),
        lastName: z.string().min(1, "Last name is required").optional(),
        phone: z.string().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required"
    });
