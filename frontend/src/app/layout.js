import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "@/app/providers";
import AppShell from "@/components/layout/AppShell";
import Analytics from "@/components/analytics/Analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata = {
  metadataBase: new URL("https://mypeptidedosages.com"),
  title: {
    default: "MyPeptideDosages – Free Peptide Dosage Calculator & Protocol Guide",
    template: "%s | MyPeptideDosages",
  },
  description:
    "Free peptide dosage calculator, reconstitution guides, and research-backed protocol schedules. Plan accurate BPC-157, Semaglutide, TB-500, and 100+ peptide dosing protocols.",
  keywords: [
    "peptide dosage calculator",
    "peptide reconstitution calculator",
    "peptide dosing chart",
    "peptide dosage chart",
    "BPC-157 dosage",
    "semaglutide dosage",
    "TB-500 protocol",
    "peptide protocol guide",
    "peptide schedule builder",
    "peptide reconstitution guide",
    "peptide dosing chart 2025",
    "peptide dosing chart 2026",
    "peptide dosage chart calculator",
    "peptides dosage chart",
    "peptide dose calculator",
    "peptide dosing chart pdf",
    "my peptide dosages",
    "mypeptidedosages",
    "how to reconstitute peptides",
    "peptide injection calculator",
    "peptide frequency chart",
    "peptide dosage and frequency chart",
  ],
  authors: [{ name: "MyPeptideDosages" }],
  creator: "MyPeptideDosages",
  publisher: "MyPeptideDosages",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MyPeptideDosages",
    title: "MyPeptideDosages – Free Peptide Dosage Calculator & Protocol Guide",
    description:
      "Free peptide dosage calculator, reconstitution guides, and research-backed protocol schedules for 100+ peptides.",
    url: "https://mypeptidedosages.com",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MyPeptideDosages – Free Peptide Dosage Calculator & Protocol Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyPeptideDosages – Free Peptide Dosage Calculator & Protocol Guide",
    description:
      "Free peptide dosage calculator, reconstitution guides, and research-backed protocol schedules for 100+ peptides.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {GA_ID && <link rel="preconnect" href="https://www.googletagmanager.com" />}
        {PIXEL_ID && <link rel="preconnect" href="https://connect.facebook.net" />}

        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}

        {/* ── Meta Pixel (deferred to idle) ── */}
        {PIXEL_ID && (
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${PIXEL_ID}');
            `}
          </Script>
        )}
      </head>

      <body className="min-h-full">
        {/* JSON-LD: Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MyPeptideDosages",
              url: "https://mypeptidedosages.com",
              logo: "https://mypeptidedosages.com/favicon.ico",
              sameAs: [],
              description:
                "Research-backed peptide dosage calculator, reconstitution guides, and protocol scheduling platform.",
            }),
          }}
        />
        {/* JSON-LD: WebSite Schema with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MyPeptideDosages",
              url: "https://mypeptidedosages.com",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://mypeptidedosages.com/library?search={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* JSON-LD: SiteNavigationElement for Google Sitelinks */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "SiteNavigationElement",
                  name: "Peptide Dosage Library",
                  url: "https://mypeptidedosages.com/library",
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "Peptide Calendar Builder",
                  url: "https://mypeptidedosages.com/schedule",
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "Peptide How-To & Info Videos",
                  url: "https://mypeptidedosages.com/videos",
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "Community",
                  url: "https://mypeptidedosages.com/community",
                },
              ],
            }),
          }}
        />
        {PIXEL_ID && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}

        <Providers>
          <Analytics />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}