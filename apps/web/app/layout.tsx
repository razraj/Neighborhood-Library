import { Providers } from "@/components/providers";
import { Toaster } from "@repo/ui/components/sonner";
import "@repo/ui/globals.css";
import { Roboto } from "next/font/google";

const roboto = Roboto({
    weight: "400",
    subsets: ["latin"]
});

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={roboto.className} suppressHydrationWarning>
            <body>
                <main>
                    <Providers>{children}</Providers>
                </main>
                <Toaster position="top-right" closeButton={true} duration={3000} />
            </body>
        </html>
    );
}
