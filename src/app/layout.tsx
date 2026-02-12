import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "em-control-tower",
  description:
    "Engineering Manager Control Tower — Track team performance, review quality, and prepare better 1:1s.",
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
