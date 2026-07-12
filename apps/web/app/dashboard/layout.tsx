import Link from 'next/link';

const NAV = [
  { href: '/dashboard/pending', label: 'Pending', badge: true },
  { href: '/dashboard/routes', label: 'Routes' },
  { href: '/dashboard/routes/manage', label: 'Manage Routes' },
  { href: '/dashboard/export', label: 'Export' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900">SLA Transport</span>
        <nav className="flex gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
