'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { POWithDetails, AFE, Vendor } from '@/types/database'
import POCreate from './components/POCreate'
import POList from './components/POList'
import PODetails from './components/PODetails'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCcw } from 'lucide-react'

export default function POPage() {
  const supabase = createClient()
  const [pos, setPOs] = useState<POWithDetails[]>([])
  const [afes, setAFEs] = useState<AFE[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedPO, setSelectedPO] = useState<POWithDetails | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('po-list')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch POs with related data
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendor:vendors(*),
          afe:afes(*),
          change_orders(*)
        `)
        .order('created_date', { ascending: false })

      if (poError) throw poError

      // Calculate total values including change orders
      const posWithTotals = poData.map(po => ({
        ...po,
        total_value: po.initial_value + po.change_orders.reduce((sum, co) => sum + co.value, 0)
      }))

      setPOs(posWithTotals)

      // Fetch AFEs
      const { data: afeData, error: afeError } = await supabase
        .from('afes')
        .select('*')
        .order('afe_number')

      if (afeError) throw afeError
      setAFEs(afeData)

      // Fetch Vendors
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .order('vendor_name')

      if (vendorError) throw vendorError
      setVendors(vendorData)

    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to fetch data')
    }
  }

  const handleCreatePO = () => {
    setShowCreateDialog(true)
  }

  const handlePOCreated = () => {
    setShowCreateDialog(false)
    fetchData()
  }

  const handlePOSelected = (po: POWithDetails) => {
    setSelectedPO(po)
  }

  const handlePOClosed = () => {
    setSelectedPO(null)
  }

  const handlePOUpdated = () => {
    fetchData()
  }

  return (
    <div className="p-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-semibold">PO Management</CardTitle>
            <Button 
              variant="outline"
              onClick={fetchData}
              className="flex items-center"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="po-list">PO List</TabsTrigger>
              <TabsTrigger value="create-po">Create PO</TabsTrigger>
              <TabsTrigger value="po-details" disabled={!selectedPO}>
                PO Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="po-list">
              <POList
                pos={pos}
                onSelect={handlePOSelected}
              />
            </TabsContent>

            <TabsContent value="create-po">
              <POCreate
                afes={afes}
                vendors={vendors}
                onSuccess={handlePOCreated}
              />
            </TabsContent>

            <TabsContent value="po-details">
              {selectedPO && (
                <PODetails
                  po={selectedPO}
                  onClose={() => {
                    setSelectedPO(null)
                    setActiveTab('po-list')
                  }}
                  onUpdate={handlePOUpdated}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  )
} 