import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}