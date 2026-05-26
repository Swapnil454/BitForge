import AdminMobileNav from "../components/admin/AdminMobileNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen pb-16 md:pb-0">
      {children}
      <AdminMobileNav />
    </div>
  );
}
