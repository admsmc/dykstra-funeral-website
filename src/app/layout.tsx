import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dykstra Funeral Home | Compassionate Care in Times of Need",
  description: "Dykstra Funeral Home provides compassionate funeral services, pre-planning, and grief support in the Midwest. Serving families with dignity and respect for over generations.",
  keywords: "funeral home, funeral services, cremation, burial, pre-planning, obituaries, grief support, memorial services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
