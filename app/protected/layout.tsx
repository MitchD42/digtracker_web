import Link from 'next/link'
import { LayoutDashboard, FileText, Wrench, ShoppingCart, Database, Package, Upload, FileOutput } from 'lucide-react'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card shadow-lg">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-primary mb-8">Dig Tracker</h1>
          <nav className="space-y-2">
            <Link 
              href="/protected/dashboard"
              className="flex items-center px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Overview
            </Link>
            <Link 
              href="/protected/afe"
              className="flex items-center px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            >
              <FileText className="h-5 w-5 mr-3" />
              AFEs
            </Link>
            <Link 
              href="/protected/gwd"
              className="flex items-center px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            >
              <Wrench className="h-5 w-5 mr-3" />
              GWDs
            </Link>
            <Link 
              href="/protected/po"
              className="flex items-center px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              Purchase Orders
            </Link>
            <Link 
              href="/protected/material"
              className="flex items-center px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            >
              <Package className="h-5 w-5 mr-3" />
              Materials
            </Link>
            <Link 
              href="/protected/data"
              className="flex items-center px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            >
              <Database className="h-5 w-5 mr-3" />
              Data
            </Link>
            <Link 
              href="/protected/reports"
              className="flex items-center px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            >
              <FileOutput className="h-5 w-5 mr-3" />
              Reports
            </Link>
            <Link 
              href="/protected/import"
              className="flex items-center px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            >
              <Upload className="h-5 w-5 mr-3" />
              Import/Export
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-background">
        {children}
      </div>
    </div>
  )
} 