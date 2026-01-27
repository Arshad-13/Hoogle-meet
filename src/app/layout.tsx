import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Hoogle Meet - Video Conferencing",
    description: "Real-time video conferencing powered by WebRTC",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
