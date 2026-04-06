export const metadata = {
  title: "Peptide How-To & Info Videos – Dosage Tutorials & Guides",
  description:
    "Watch expert peptide how-to and info videos covering dosage protocols, reconstitution techniques, and research-backed peptide guides.",
  alternates: { canonical: "/videos" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MyPeptideDosages",
    title: "Peptide How-To & Info Videos – Dosage Tutorials & Guides",
    description:
      "Watch expert peptide how-to and info videos covering dosage protocols, reconstitution techniques, and research-backed guides.",
    url: "https://mypeptidedosages.com/videos",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MyPeptideDosages – Peptide How-To & Info Videos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Peptide How-To & Info Videos – Dosage Tutorials & Guides",
    description:
      "Watch expert peptide how-to and info videos covering dosage protocols, reconstitution techniques, and research-backed guides.",
    images: ["/opengraph-image"],
  },
};

export default function VideosLayout({ children }) {
  return children;
}
