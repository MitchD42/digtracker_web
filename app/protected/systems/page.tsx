'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { System, Pipeline } from '@/types/database'
import SystemsList from './components/SystemsList'

export default function SystemsPage() {
  const supabase = createClient()
  const [systems, setSystems] = useState<System[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSystems = async () => {
    try {
      const { data, error } = await supabase
        .from('systems')
        .select('*')
        .order('system_name')

      if (error) throw error
      setSystems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load systems')
    }
  }

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      await loadSystems()
      setIsLoading(false)
    }
    initialize()
  }, [])

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Systems Management</CardTitle>
            <Button variant="outline" onClick={loadSystems}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        {error && (
          <div className="p-4 mb-4 text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <div className="p-6">
          <SystemsList
            systems={systems}
            onSystemsChange={loadSystems}
          />
        </div>
      </Card>
    </div>
  )
} 