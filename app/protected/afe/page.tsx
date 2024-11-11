'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw, ListIcon, PlusCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AFE, GWDWithAFE, PurchaseOrderWithDetails, System, AFEWithPipelines } from '@/types/database'
import AFEList from './_components/AFEList'
import AFEDetails from './_components/AFEDetails'
import AFECreate from './_components/AFECreate'
import { getAFEs, getSystems } from '@/utils/supabase/queries'

export default function AFEPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [afes, setAFEs] = useState<AFEWithPipelines[]>([])
  const [systems, setSystems] = useState<System[]>([])
  const [selectedAFE, setSelectedAFE] = useState<AFEWithPipelines | null>(null)
  const [gwds, setGWDs] = useState<GWDWithAFE[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithDetails[]>([])
  const [activeTab, setActiveTab] = useState('list')

  const refreshAFEs = async () => {
    try {
      console.log('Refreshing AFEs...')
      const data = await getAFEs()
      console.log('AFEs refreshed successfully:', data.length)
      setAFEs(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error in refreshAFEs:', {
        error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })
      setError(`Failed to load AFEs: ${errorMessage}`)
    }
  }

  const loadSystems = async () => {
    try {
      const data = await getSystems()
      setSystems(data)
    } catch (error) {
      console.error('Error loading systems:', error)
      setError('Failed to load systems')
    }
  }

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const results = await Promise.allSettled([refreshAFEs(), loadSystems()])
        
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Operation ${index} failed:`, result.reason)
            throw result.reason
          }
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        console.error('Initialization error:', {
          error,
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        })
        setError(`Failed to initialize application: ${errorMessage}`)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 border rounded-lg bg-red-50">
        <h3 className="text-lg font-medium mb-2">Error</h3>
        <p>{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
          variant="outline"
        >
          Retry
        </Button>
      </div>
    )
  }

  const loadAFEDetails = async (afe: AFEWithPipelines) => {
    try {
      const [gwdData, poData, pipelineData] = await Promise.all([
        supabase
          .from('gwds')
          .select('*, afe:afes(*)')
          .eq('afe_id', afe.afe_id)
          .order('gwd_number'),
        supabase
          .from('purchase_orders')
          .select(`
            *,
            vendor:vendors(*),
            afe:afes(*),
            change_orders(*)
          `)
          .eq('afe_id', afe.afe_id)
          .order('created_date', { ascending: false }),
        supabase
          .from('afe_pipelines')
          .select(`
            afe_pipeline_id,
            afe_id,
            pipeline_id,
            created_date,
            pipeline:pipelines (
              pipeline_id,
              pipeline_name,
              system_id,
              created_date
            )
          `)
          .eq('afe_id', afe.afe_id)
      ])

      if (gwdData.error) throw gwdData.error
      if (poData.error) throw poData.error
      if (pipelineData.error) throw pipelineData.error

      setSelectedAFE(afe)
      setGWDs(gwdData.data)
      setPurchaseOrders(poData.data)
      setActiveTab('details')
    } catch (error) {
      console.error('Error loading AFE details:', error)
    }
  }

  const handleCreateSuccess = () => {
    refreshAFEs()
    setActiveTab('list')
  }

  const handleUpdateSuccess = () => {
    refreshAFEs()
    loadAFEDetails(selectedAFE!)
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-semibold">AFE Management</CardTitle>
            <Button 
              variant="outline"
              onClick={refreshAFEs}
              className="flex items-center"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">
                <ListIcon className="h-4 w-4 mr-2" />
                AFE List
              </TabsTrigger>
              <TabsTrigger value="create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create AFE
              </TabsTrigger>
              <TabsTrigger value="details" disabled={!selectedAFE}>
                AFE Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <AFEList 
                afes={afes} 
                systems={systems}
                onSelect={(afe: AFEWithPipelines) => loadAFEDetails(afe)} 
              />
            </TabsContent>

            <TabsContent value="create">
              <AFECreate 
                systems={systems}
                onSuccess={handleCreateSuccess} 
              />
            </TabsContent>

            <TabsContent value="details">
              {selectedAFE && (
                <AFEDetails
                  afe={selectedAFE as AFEWithPipelines}
                  gwds={gwds}
                  purchaseOrders={purchaseOrders}
                  systems={systems}
                  onClose={() => {
                    setSelectedAFE(null)
                    setActiveTab('list')
                  }}
                  onUpdate={handleUpdateSuccess}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  )
}
