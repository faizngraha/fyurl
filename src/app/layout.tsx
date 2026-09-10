import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import AuthProvider from '@/components/AuthProvider';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { Toaster } from 'react-hot-toast';
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fyurl.id'),
  title: {
    default: "Fyurl | Advanced URL Shortener & QR Code Generator",
    template: "%s | Fyurl"
  },
  icons: {
    icon: [
      { url: '/icon.png' },
      new URL('/icon.png', 'https://fyurl.id'),
    ],
    shortcut: '/icon.png',
    apple: [
      { url: '/icon.png' },
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  description: "Fyurl (formerly Fylink) is a fast, no-nonsense tool to shorten long URLs, create custom aliases, and generate QR codes. Free to use, trackable, and secure. Built by Fayiz Apriwansyah Nugraha.",
  keywords: [
    "url shortener", "link shortener", "custom url", "qr code generator", 
    "shorten link", "link management", "branded links", "free url shortener",
    "persingkat URL", "pemendek link", "short link gratis", "custom domains", "Fyurl", "Fylink", "fyurl.id",
    "bit.ly alternatives", "design short url", "slug generator", "qr code alternatives", "link management tool",
    "trackable qr codes", "personalized urls", "how to create a vanity url", "best link shorteners", "best qr codes",
    "what is a branded short domain", "vanity url best practices", "what is personalized url", "what is a vanity link", "what is a vanity url",
    "best qr code generator", "temporary link generator", "url shortener extension chrome", "whatsapp group qr code", "influencer conversion rate",
    "create qr code for google maps", "cross channel attribution", "qr code pens", "influencer measurement", "sharing text messages",
    "how long does a bitly link last", "url forwarding", "qr code generator with tracker", "how to shorten a link", "vanity link meaning",
    "do tiny urls expire", "emoji urls", "url slug", "how does url shortening work", "managing links",
    "create vanity url", "bitly alternatives", "vanity url meaning", "do bitly qr codes expire", "shorten a hyperlink",
    "tinyurl qr code generator", "best qr", "url slug examples", "shorten a url", "short link url",
    "what is a share code", "what-are-url-shorteners", "shortened url", "url redirect service", "how does url shortener work",
    "alternatif bit.ly", "buat url pendek", "pembuat slug", "alternatif qr code", "alat manajemen link",
    "qr code yang bisa dilacak", "url personalisasi", "cara membuat vanity url", "pemendek link terbaik", "qr code terbaik",
    "apa itu domain pendek bermerek", "praktik terbaik vanity url", "apa itu url personalisasi", "apa itu vanity link", "apa itu vanity url",
    "pembuat qr code terbaik", "pembuat link sementara", "ekstensi pemendek url chrome", "qr code grup whatsapp", "tingkat konversi influencer",
    "buat qr code untuk google maps", "atribusi lintas saluran", "pengukuran influencer", "membagikan pesan teks",
    "berapa lama link bitly bertahan", "pengalihan url", "pembuat qr code dengan pelacak", "cara memendekkan link", "arti vanity link",
    "apakah tiny url kedaluwarsa", "url emoji", "slug url", "bagaimana cara kerja pemendekan url", "mengelola link",
    "buat vanity url", "alternatif bitly", "arti vanity url", "apakah qr code bitly bisa kedaluwarsa", "memendekkan hyperlink",
    "pembuat qr code tinyurl", "qr terbaik", "contoh slug url", "memendekkan url", "url link pendek",
    "apa itu kode berbagi", "apa itu pemendek url", "url yang dipendekkan", "layanan pengalihan url", "bagaimana cara kerja pemendek url"
  ],
  authors: [{ name: "Fayiz Apriwansyah Nugraha", url: "https://byfayiz.web.id/portofolio" }],
  creator: "Fayiz Apriwansyah Nugraha",
  publisher: "Fayiz Apriwansyah Nugraha",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fyurl.id",
    title: "Fyurl | Advanced URL Shortener",
    description: "Fyurl is a fast, no-nonsense tool to shorten long URLs, create custom aliases, and generate QR codes. Free to use, trackable, and secure.",
    siteName: "Fyurl",
    images: [
      {
        url: "/logo/fyurl-horizontal.png",
        width: 1200,
        height: 630,
        alt: "Fyurl Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fyurl | Advanced URL Shortener",
    description: "Fyurl is a fast, no-nonsense tool to shorten long URLs, create custom aliases, and generate QR codes.",
    images: ["/logo/fyurl-horizontal.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://fyurl.id",
  },
  verification: {
    google: "lZTeeEIIitxfak5hZ14H8RZjHSjqHL6fnjuDCZbL-S4",
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://fyurl.id/#fayiz",
      "name": "Fayiz Apriwansyah Nugraha",
      "url": "https://byfayiz.web.id/portofolio",
      "jobTitle": "Web Developer",
      "sameAs": [
        "https://instagram.com/fyurl.id"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://fyurl.id/#website",
      "url": "https://fyurl.id",
      "name": "Fyurl",
      "author": { "@id": "https://fyurl.id/#fayiz" },
      "publisher": { "@id": "https://fyurl.id/#fayiz" },
      "description": "Enterprise-grade URL shortener with custom domains and analytics.",
    },
    {
      "@type": "SoftwareApplication",
      "name": "Fyurl",
      "operatingSystem": "Web",
      "applicationCategory": "UtilitiesApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "description": "An advanced URL shortener platform allowing users to shrink long URLs, use custom domains, track clicks, and generate QR codes for free.",
      "author": { "@id": "https://fyurl.id/#fayiz" },
      "creator": { "@id": "https://fyurl.id/#fayiz" }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased h-full`} suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          suppressHydrationWarning
        />
        <meta name="google-adsense-account" content="ca-pub-3303348584536351" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3303348584536351"
          crossOrigin="anonymous"
          suppressHydrationWarning
        ></script>
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextTopLoader color="#0ea5e9" showSpinner={false} height={3} shadow="0 0 10px #0ea5e9,0 0 5px #0ea5e9" />
        <Toaster position="top-center" />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Footer />
        <CookieConsent />
        <Analytics />
        <AnalyticsTracker />
      </body>
    </html>
  );
}

