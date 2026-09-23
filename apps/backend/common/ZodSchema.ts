import { z } from "zod";

export const loginRequestSchema = z.object({
    username: z.string().email(),
    password: z.string().min(8)
});

export const signupRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    username: z.string().min(3),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    profilePic: z.string().url().optional()
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

export const contactFormSchema = z.object({
    name: z.string().min(2, { message: "Please enter your name" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    message: z.string().min(10, { message: "Please make sure your message is at least 10 characters long." })
});

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const isoYearSchema = z.string().regex(/^\d{4}$/, "Expected a 4-digit year");

//
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
    memberId: z.string().min(1),
    copyId: z.string().min(1),
    daysToBorrow: z.coerce.number().int().min(1).default(14)
});

export const updateProfileSchema = z
    .object({
        firstName: z.string().min(1, "First name is required").optional(),
        lastName: z.string().min(1, "Last name is required").optional(),
        username: z.string().min(3, "Username must be at least 3 characters").optional(),
        profilePic: z.string().url().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required"
    });
