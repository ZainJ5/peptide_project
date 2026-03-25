import Link from "next/link";

export default function FooterNotice() {
  return (
    <footer className="border-t border-slate-200 bg-white/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-600 md:flex-row md:items-center md:justify-between md:px-6">
        <p>
          Medical Disclaimer: educational information only. Always consult a licensed clinician before making treatment decisions.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-(--color-primary)">About</Link>
          <Link href="/faq" className="hover:text-(--color-primary)">FAQ</Link>
          <Link href="/disclaimer" className="hover:text-(--color-primary)">Disclaimer</Link>
        </div>
      </div>
    </footer>
  );
}
