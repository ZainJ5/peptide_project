export const metadata = {
  title: "Peptide Dosage Library – Research Protocols for 100+ Peptides",
  description:
    "Browse research-backed dosage protocols, reconstitution guides, and dosing schedules for BPC-157, Semaglutide, TB-500, CJC-1295, Ipamorelin, and 100+ peptides.",
  alternates: { canonical: "/library" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MyPeptideDosages",
    title: "Peptide Dosage Library – Research Protocols for 100+ Peptides",
    description:
      "Browse research-backed dosage protocols, reconstitution guides, and dosing schedules for 100+ peptides.",
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
    title: "Peptide Dosage Library – Research Protocols for 100+ Peptides",
    description:
      "Browse research-backed dosage protocols, reconstitution guides, and dosing schedules for 100+ peptides.",
    images: ["/opengraph-image"],
  },
};

export default function LibraryLayout({ children }) {
  return children;
}
