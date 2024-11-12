'use client'

import Link from 'next/link'
import { LayoutDashboard, FileText, Wrench, ShoppingCart, Database, Package, Upload, FileOutput, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 w-64 bg-card shadow-lg flex flex-col">
        <div className="p-4 flex-1">
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
        
        {/* Logout button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64">
        <main className="h-full p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 