'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GWDWithAFE, AFE, System, AFEWithPipelines } from '@/types/database'
import { createClient } from '@/utils/supabase/client'
import GWDList from './_components/GWDList'
import GWDCreate from './_components/GWDCreate'
import GWDDetails from './_components/GWDDetails'
import GWDMassEdit from './_components/GWDMassEdit'

export default function GWDPage() {
  const supabase = createClient()
  const [gwds, setGWDs] = useState<GWDWithAFE[]>([])
  const [afes, setAFEs] = useState<AFEWithPipelines[]>([])
  const [systems, setSystems] = useState<System[]>([])
  const [selectedGWD, setSelectedGWD] = useState<GWDWithAFE | null>(null)
  const [activeTab, setActiveTab] = useState('list')

  const refreshGWDs = async () => {
    try {
      const { data, error } = await supabase
        .from('gwds')
        .select(`
          *,
          afe:afes(*)
        `)
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
      
      const { data: afes, error: afeError } = await supabase
        .from('afes')
        .select(`
          *,
          system:systems!afes_system_id_fkey(*),
          afe_pipelines (
            afe_pipeline_id,
            pipeline:pipelines (
              pipeline_id,
              pipeline_name
            )
          )
        `)
        .order('afe_number')
      
      if (afeError) {
        console.log('Supabase Error:', {
          error: afeError,
          message: afeError.message,
          code: afeError.code,
          details: afeError.details
        })
        return
      }

      if (afes?.[0]) {
        console.log('First AFE structure:', {
          afe_id: afes[0].afe_id,
          afe_number: afes[0].afe_number,
          system: afes[0].system,
          pipelines: afes[0].afe_pipelines
        })
      }

      setAFEs(afes || [])
    } catch (error) {
      console.error('Error loading AFEs:', error)
    }
  }

  const loadSystems = async () => {
    try {
      const { data, error } = await supabase
        .from('systems')
        .select('*')
        .order('system_name')
      
      if (error) throw error
      setSystems(data || [])
    } catch (error) {
      console.error('Error loading systems:', error)
    }
  }

  useEffect(() => {
    refreshGWDs()
    loadAFEs()
    loadSystems()
  }, [])

  // When a GWD is selected, switch to details tab
  const handleGWDSelect = (gwd: GWDWithAFE) => {
    setSelectedGWD(gwd)
    setActiveTab('details')
  }

  return (
    <div className="p-6">
      <Card>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="list">GWD List</TabsTrigger>
              <TabsTrigger value="create">Create GWD</TabsTrigger>
              <TabsTrigger value="details" disabled={!selectedGWD}>
                GWD Details
              </TabsTrigger>
              <TabsTrigger value="mass-edit">Mass Edit</TabsTrigger>
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
                systems={systems}
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
                  afes={afes}
                  onClose={() => {
                    setSelectedGWD(null)
                    setActiveTab('list')
                  }}
                  onUpdate={refreshGWDs}
                />
              )}
            </TabsContent>

            <TabsContent value="mass-edit">
              <GWDMassEdit 
                gwds={gwds}
                afes={afes}
                onUpdate={refreshGWDs}
              />
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  )
} 