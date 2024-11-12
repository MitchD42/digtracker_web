'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import ReportList from '@/app/protected/reports/_components/ReportList'
import ReportGenerator from '@/app/protected/reports/_components/ReportGenerator'
import { ReportFilters } from '@/app/protected/reports/_components/ReportFilters'
import { ReportActions } from '@/app/protected/reports/_components/ReportActions'
import { UI } from '@/lib/constants/ui'
import { GWDWithAFE } from '@/types/database'

export default function ReportsPage() {
  const supabase = createClient()
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<{
    gwds: GWDWithAFE[] | null,
    costs: any[] | null
  }>({
    gwds: null,
    costs: null
  })

  // Fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [gwdsResponse, costsResponse] = await Promise.all([
          supabase
            .from('gwds')
            .select(`
              *,
              afe:afes(*)
            `),
          supabase
            .from('gwds')
            .select(`
              gwd_number,
              initial_budget,
              land_cost,
              dig_cost
            `)
        ])

        setData({
          gwds: gwdsResponse.data,
          costs: costsResponse.data
        })
      } catch (error) {
        console.error('Error fetching report data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleExport = async (format: string) => {
    if (!selectedReport) return

    switch (format) {
      case 'pdf':
        // Implement PDF export
        break
      case 'excel':
        // Implement Excel export
        break
      case 'csv':
        // Implement CSV export
        break
    }
  }

  const handleEmail = () => {
    // Implement email functionality
  }

  return (
    <div className={UI.containers.section}>
      <h1 className={UI.text.title + " text-2xl mb-6"}>Reports</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <ReportList
            onSelect={setSelectedReport}
            selected={selectedReport}
          />
          <ReportFilters />
          <ReportActions 
            onExport={handleExport}
            onEmail={handleEmail}
            data={data}
          />
        </div>

        {/* Main Report Area */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className={UI.containers.loading}>Loading report data...</div>
          ) : selectedReport ? (
            <ReportGenerator 
              reportType={selectedReport}
              data={data}
            />
          ) : (
            <div className={UI.emptyState.container}>
              <h3 className={UI.emptyState.title}>Select a Report</h3>
              <p className={UI.emptyState.description}>
                Choose a report type from the list to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 