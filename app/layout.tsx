import type { ReactNode } from "react";

export const metadata = {
  title: "MTG Custom Art Generator",
  description: "Generate themed proxy artwork for Magic: The Gathering cards.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#191919",
          color: "#e5e5e5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
