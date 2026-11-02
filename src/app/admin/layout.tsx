import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="min-h-screen px-4 pb-10 pt-20 sm:px-6 lg:ml-64 lg:px-8 lg:pb-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}