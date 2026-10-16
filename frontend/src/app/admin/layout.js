import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: { default: "Admin", template: "%s · Admin | My Peptide Dosages" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
  return (
    <div className="admin-root">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
