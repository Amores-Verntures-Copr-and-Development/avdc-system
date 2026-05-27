import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose the weights you need
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "AVDC",
  description: "AVDC System",
  icons: {
    icon: "/AVDCLogoOnly.png", // 32x32 or default size
    apple: "/AVDCLogoOnly.png", // optional for iOS
    shortcut: "/AVDCLogoOnly.png", // optional for old browsers
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className={` ${poppins.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
