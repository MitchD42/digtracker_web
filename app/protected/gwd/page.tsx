'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GWDWithAFE, AFE } from '@/types/database'
import { createClient } from '@/utils/supabase/client'
import GWDList from './components/GWDList'
import GWDCreate from './components/GWDCreate'
import GWDDetails from './components/GWDDetails'

export default function GWDPage() {
  const supabase = createClient()
  const [gwds, setGWDs] = useState<GWDWithAFE[]>([])
  const [afes, setAFEs] = useState<AFE[]>([])
  const [selectedGWD, setSelectedGWD] = useState<GWDWithAFE | null>(null)
  const [activeTab, setActiveTab] = useState('list')

  const refreshGWDs = async () => {
    try {
      const { data, error } = await supabase
        .from('gwds')
        .select('*, afe:afes(*)')
        .order('created_date', { ascending: false })
      
      if (error) throw error
      setGWDs(data)
    } catch (error) {
      console.error('Error fetching GWDs:', error)
    }
  }

  const loadAFEs = async () => {
    try {
      console.log('Fetching AFEs...')

      // First get basic AFE data
      const { data: afeData, error: afeError } = await supabase
        .from('afes')
        .select('*')
        .order('afe_number')
      
      if (afeError) {
        console.error('Supabase AFE error:', afeError)
        throw afeError
      }

      // Then get pipeline data for each AFE
      const { data: pipelineData, error: pipelineError } = await supabase
        .from('afe_pipelines')
        .select('*')
      
      if (pipelineError) {
        console.error('Supabase pipeline error:', pipelineError)
        throw pipelineError
      }

      // Combine the data
      const afesWithPipelines = afeData.map(afe => ({
        ...afe,
        pipelines: pipelineData.filter(p => p.afe_id === afe.afe_id)
      }))

      console.log('AFEs loaded:', afesWithPipelines)
      setAFEs(afesWithPipelines)
    } catch (error) {
      console.error('Full error object:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown error type',
        message: error instanceof Error ? error.message : 'Unknown error message',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
    }
  }

  useEffect(() => {
    refreshGWDs()
    loadAFEs()
  }, [])

  // When a GWD is selected, switch to details tab
  const handleGWDSelect = (gwd: GWDWithAFE) => {
    setSelectedGWD(gwd)
    setActiveTab('details')
  }

  return (
    <div className="p-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-semibold">GWD Management</CardTitle>
            <Button 
              variant="outline"
              onClick={refreshGWDs}
              className="flex items-center"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">GWD List</TabsTrigger>
              <TabsTrigger value="create">Create GWD</TabsTrigger>
              <TabsTrigger value="details" disabled={!selectedGWD}>
                GWD Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <GWDList 
                gwds={gwds} 
                onSelect={handleGWDSelect} 
              />
            </TabsContent>

            <TabsContent value="create">
              <GWDCreate 
                afes={afes}
                onSuccess={() => {
                  refreshGWDs()
                  setActiveTab('list')
                }}
              />
            </TabsContent>

            <TabsContent value="details">
              {selectedGWD && (
                <GWDDetails 
                  gwd={selectedGWD}
                  onClose={() => {
                    setSelectedGWD(null)
                    setActiveTab('list')
                  }}
                  onUpdate={refreshGWDs}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  )
} 