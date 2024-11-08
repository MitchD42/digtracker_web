'use client'

import { useState, useEffect } from 'react'
import { 
  getAFEs, 
  getGWDsByAFE, 
  getVendors,
  getPOsByAFE,
  getChecklistTemplates 
} from '@/utils/supabase/queries'
import { Button } from '@/components/ui/button'

export default function TestPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    try {
      setLoading(true)
      setError(null)

      // Test AFEs
      console.log('Testing AFE queries...')
      const afes = await getAFEs()
      console.log('AFEs:', afes)

      if (afes.length > 0) {
        // Test GWDs
        console.log('\nTesting GWD queries...')
        const gwds = await getGWDsByAFE(afes[0].afe_id)
        console.log('GWDs for first AFE:', gwds)

        // Test POs
        console.log('\nTesting PO queries...')
        const pos = await getPOsByAFE(afes[0].afe_id)
        console.log('POs for first AFE:', pos)
      }

      // Test Vendors
      console.log('\nTesting Vendor queries...')
      const vendors = await getVendors()
      console.log('Vendors:', vendors)

      // Test Checklists
      console.log('\nTesting Checklist queries...')
      const templates = await getChecklistTemplates()
      console.log('Checklist Templates:', templates)

    } catch (e) {
      console.error('Test error:', e)
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Button 
        onClick={runTests}
        disabled={loading}
      >
        {loading ? 'Running Tests...' : 'Run All Tests'}
      </Button>

      <p className="mt-4 text-sm text-gray-600">
        Check the browser console (F12) to see test results
      </p>
    </div>
  )
} 