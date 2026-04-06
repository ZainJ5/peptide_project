export const metadata = {
  title: "Peptide Community – Discuss Protocols & Share Experiences",
  description:
    "Join the MyPeptideDosages community to discuss peptide protocols, share dosing experiences, and learn from fellow researchers.",
  alternates: { canonical: "/community" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MyPeptideDosages",
    title: "Peptide Community – Discuss Protocols & Share Experiences",
    description:
      "Join the MyPeptideDosages community to discuss peptide protocols and share dosing experiences.",
    url: "https://mypeptidedosages.com/community",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MyPeptideDosages – Peptide Community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Peptide Community – Discuss Protocols & Share Experiences",
    description:
      "Join the MyPeptideDosages community to discuss peptide protocols and share dosing experiences.",
    images: ["/opengraph-image"],
  },
};

export default function CommunityLayout({ children }) {
  return children;
}
