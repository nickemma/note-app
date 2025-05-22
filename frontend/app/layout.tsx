import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Note Taking App",
  description: "A modern note-taking application demonstrating the integration of multiple programming languages and databases.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
