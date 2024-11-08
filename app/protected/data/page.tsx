'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { System, Vendor, ConstructionSupervisor, CSWithDetails } from '@/types/database'
import SystemsList from './components/SystemsList'
import VendorList from './components/VendorList'
import CSList from './components/CSList'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DataType = 'systems' | 'vendors' | 'construction-supervisors'

export default function DataPage() {
  const supabase = createClient()
  const [dataType, setDataType] = useState<DataType>('systems')
  const [systems, setSystems] = useState<System[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [supervisors, setSupervisors] = useState<CSWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      switch (dataType) {
        case 'systems':
          const { data: systemsData, error: systemsError } = await supabase
            .from('systems')
            .select('*')
            .order('system_name')
          if (systemsError) throw systemsError
          setSystems(systemsData)
          break

        case 'vendors':
          const { data: vendorsData, error: vendorsError } = await supabase
            .from('vendors')
            .select('*')
            .order('vendor_name')
          if (vendorsError) throw vendorsError
          setVendors(vendorsData)
          break

        case 'construction-supervisors':
          const { data: csData, error: csError } = await supabase
            .from('construction_supervisors')
            .select(`
              *,
              purchase_orders: cs_pos!cs_id (
                po:purchase_orders (
                  *,
                  vendor:vendors (*),
                  change_orders (*)
                ),
                cs_po_id,
                cs_id,
                po_id,
                work_start,
                work_end,
                created_date
              ),
              gwds: cs_gwds!cs_id (
                gwd:gwds (
                  *,
                  afe:afes (*)
                ),
                cs_gwd_id,
                cs_id,
                gwd_id,
                work_start,
                work_end,
                created_date
              )
            `)
            .order('name')
          if (csError) throw csError
          setSupervisors(csData)
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [dataType])

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <CardTitle>Data Management</CardTitle>
              <Select value={dataType} onValueChange={(value: DataType) => setDataType(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="systems">Systems</SelectItem>
                  <SelectItem value="vendors">Vendors</SelectItem>
                  <SelectItem value="construction-supervisors">Construction Supervisors</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadData}>
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
          {dataType === 'systems' && (
            <SystemsList
              systems={systems}
              onSystemsChange={loadData}
            />
          )}
          {dataType === 'vendors' && (
            <VendorList
              vendors={vendors}
              onVendorsChange={loadData}
            />
          )}
          {dataType === 'construction-supervisors' && (
            <CSList
              supervisors={supervisors}
              onSupervisorsChange={loadData}
            />
          )}
        </div>
      </Card>
    </div>
  )
} 