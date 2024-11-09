'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw, ListIcon, PlusCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Material, Vendor } from '@/types/database'
import MaterialList from './_components/MaterialList'
import MaterialDetails from './_components/MaterialDetails'
import MaterialCreate from './_components/MaterialCreate'
import { getMaterials, getVendors } from '@/utils/supabase/queries'

export default function MaterialPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [activeTab, setActiveTab] = useState('list')

  const refreshMaterials = async () => {
    try {
      console.log('Refreshing Materials...')
      const data = await getMaterials()
      console.log('Materials refreshed successfully:', data.length)
      setMaterials(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error in refreshMaterials:', {
        error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })
      setError(`Failed to load Materials: ${errorMessage}`)
    }
  }

  const loadInitialData = async () => {
    try {
      const vendorsData = await getVendors()
      setVendors(vendorsData)
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Failed to load initial data')
    }
  }

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const results = await Promise.allSettled([refreshMaterials(), loadInitialData()])
        
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

  const loadMaterialDetails = async (material: Material) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq('material_id', material.material_id)
        .single()

      if (error) throw error

      setSelectedMaterial(data)
      setActiveTab('details')
    } catch (error) {
      console.error('Error loading material details:', error)
    }
  }

  const handleCreateSuccess = () => {
    refreshMaterials()
    setActiveTab('list')
  }

  const handleUpdateSuccess = () => {
    refreshMaterials()
    if (selectedMaterial) {
      loadMaterialDetails(selectedMaterial)
    }
  }

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

  return (
    <div className="p-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-semibold">Material Management</CardTitle>
            <Button 
              variant="outline"
              onClick={refreshMaterials}
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
                Material List
              </TabsTrigger>
              <TabsTrigger value="create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Material
              </TabsTrigger>
              <TabsTrigger value="details" disabled={!selectedMaterial}>
                Material Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <MaterialList 
                materials={materials}
                onSelect={(material: Material) => loadMaterialDetails(material)}
              />
            </TabsContent>

            <TabsContent value="create">
              <MaterialCreate 
                vendors={vendors}
                onSuccess={handleCreateSuccess}
              />
            </TabsContent>

            <TabsContent value="details">
              {selectedMaterial && (
                <MaterialDetails
                  material={selectedMaterial}
                  onClose={() => {
                    setSelectedMaterial(null)
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