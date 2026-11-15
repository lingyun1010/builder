import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Builder",
  description: "Build an app by chatting. Builder runs the process for you.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
