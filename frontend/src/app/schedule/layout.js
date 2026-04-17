export const metadata = {
  title: "Peptide Calendar Builder – Custom Dosing Schedules",
  description:
    "Create personalized peptide dosing schedules with the My Peptide Dosages interactive calendar builder. Plan injection frequency, cycle duration, and dose escalation for any protocol.",
  alternates: { canonical: "/schedule" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MyPeptideDosages",
    title: "Peptide Calendar Builder – Custom Dosing Schedules",
    description:
      "Create personalized peptide dosing schedules with the My Peptide Dosages interactive calendar builder.",
    url: "https://mypeptidedosages.com/schedule",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MyPeptideDosages – Peptide Calendar Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Peptide Calendar Builder – Custom Dosing Schedules",
    description:
      "Create personalized peptide dosing schedules with the My Peptide Dosages interactive calendar builder.",
    images: ["/opengraph-image"],
  },
};

export default function ScheduleLayout({ children }) {
  return children;
}
