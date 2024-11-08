import Link from 'next/link'
import { LayoutDashboard, FileText, Wrench, ShoppingCart, Database } from 'lucide-react'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-black shadow-lg">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-white mb-8">Dig Tracker</h1>
          <nav className="space-y-2">
            <Link 
              href="/protected/dashboard"
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Overview
            </Link>
            <Link 
              href="/protected/afe"
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              <FileText className="h-5 w-5 mr-3" />
              AFEs
            </Link>
            <Link 
              href="/protected/gwd"
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              <Wrench className="h-5 w-5 mr-3" />
              GWDs
            </Link>
            <Link 
              href="/protected/po"
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              Purchase Orders
            </Link>
            <Link 
              href="/protected/systems"
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              <Database className="h-5 w-5 mr-3" />
              Systems
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
} 