export const metadata = {
  title: "Peptide Dosage Library – 100+ Research Protocols",
  description:
    "Browse 100+ peptide dosage protocols with complete reconstitution guides, injection frequencies, cycle schedules, and research-backed dosing charts. Find BPC-157, Semaglutide, TB-500, and more.",
  alternates: { canonical: "/library" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MyPeptideDosages",
    title: "Peptide Dosage Library – 100+ Research Protocols",
    description:
      "Browse 100+ peptide dosage protocols with complete reconstitution guides, injection frequencies, and research-backed dosing charts.",
    url: "https://mypeptidedosages.com/library",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MyPeptideDosages – Peptide Dosage Library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Peptide Dosage Library – 100+ Research Protocols",
    description:
      "Browse 100+ peptide dosage protocols with complete reconstitution guides, injection frequencies, and research-backed dosing charts.",
    images: ["/opengraph-image"],
  },
};

export default function LibraryLayout({ children }) {
  return children;
}
