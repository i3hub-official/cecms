
import type { Metadata, Viewport } from "next";
// import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeContext";
import NotificationContainer from '@/app/components/ui/NotificationContainer';

export const metadata: Metadata = {
  title: "CECMS - Admin Management System",
  description:
    "Comprehensive Educational Center Okigwe - Modern school management platform for administrators, teachers, and students. Streamline academic operations with our secure, efficient management system.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      {
        url: "/android-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/apple-icon-57x57.png", sizes: "57x57" },
      { url: "/apple-icon-60x60.png", sizes: "60x60" },
      { url: "/apple-icon-72x72.png", sizes: "72x72" },
      { url: "/apple-icon-76x76.png", sizes: "76x76" },
      { url: "/apple-icon-114x114.png", sizes: "114x114" },
      { url: "/apple-icon-120x120.png", sizes: "120x120" },
      { url: "/apple-icon-144x144.png", sizes: "144x144" },
      { url: "/apple-icon-152x152.png", sizes: "152x152" },
      { url: "/apple-icon-180x180.png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.json",

  // Social previews
  openGraph: {
    title: "CECMS - Admin Management System",
    description:
      "Modern school management platform for Comprehensive Educational Center Okigwe. Streamline academic operations with our secure, efficient data management system.",
    url: "https://cecms.vercel.app",
    siteName: "CECMS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CECMS - Modern School Management Platform",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CECMS - Admin Management System",
    description:
      "Modern school management platform for Comprehensive Educational Center Okigwe.",
    images: ["/og-image.png"],
  },

  // Additional metadata for education/school context
  keywords: [
    "school management",
    "educational center",
    "CECMS",
    "student management",
    "academic platform",
    "education technology",
    "school administration",
  ].join(", "),

  authors: [{ name: "CECMS" }],
  category: "education",

  // Note: themeColor has been moved to viewport export below
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CECMS",
  },
};

// Add viewport export with themeColor
export const viewport: Viewport = {
  themeColor: "#ffffff", // Or use your school color #1e40af if preferred
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="bg-background text-foreground transition-colors duration-300"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <NotificationContainer />
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
