import Link from 'next/link';

/**
 * Family Portal Layout
 * Protected layout for authenticated families
 * 
 * Features:
 * - Navigation sidebar
 * - User profile header
 * - Logout functionality
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[--cream]">
      {/* Header */}
      <header className="bg-[--navy] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-serif">Dykstra Funeral Home Portal</h1>
          <nav className="flex items-center gap-4">
            <Link href="/portal/dashboard" className="hover:text-[--gold] transition">
              Dashboard
            </Link>
            <Link href="/portal/profile" className="hover:text-[--gold] transition">
              Profile
            </Link>
            <Link href="/sign-in" className="hover:text-[--gold] transition">
              Logout
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
