import { emailVerificationHtml } from "@/common/emailer-html/email-verification";
import { passwordResetHtml } from "@/common/emailer-html/password-reset";
import { webUrl } from "@/utils/auth";
import { Resend } from "resend";

function verificationLink(token: string): string {
    return `${webUrl}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function sendEmail(link: string, from: string, to: string, subject: string, html: string) {
    if (process.env.NODE_ENV !== "production") {
        console.info("[email:dev]", subject, "for", to, "->", link);
        return;
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailOptions: Parameters<typeof resend.emails.send>[0] = {
        from,
        to: [to],
        subject,
        html
    };
    const { data, error } = await resend.emails.send(emailOptions);
    if (error) {
        throw new Error(`Email sending error: ${error.message}`);
    }
    console.log(`Email ${data?.id} has been sent`);
}

export async function sendSignupVerificationEmail(to: string, token: string): Promise<void> {
    const link = verificationLink(token);
    await sendEmail(link, "onboarding@resend.dev", to, "Verify your email", emailVerificationHtml(link));
}

function passwordResetLink(token: string): string {
    return `${webUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = passwordResetLink(token);
    await sendEmail(link, "onboarding@resend.dev", to, "Reset your password", passwordResetHtml(link));
}
