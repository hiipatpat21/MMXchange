import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MMXchange", template: "%s | MMXchange" },
  description: "Share what you know. Learn something new through student skill exchanges and group sessions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
