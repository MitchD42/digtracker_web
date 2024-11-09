'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw, Database, Users, HardHat } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { System, Vendor, CSWithDetails } from '@/types/database'
import SystemsList from './_components/SystemsList'
import VendorList from './_components/VendorList'
import CSList from './_components/CSList'
import { motion } from 'framer-motion'

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

  const dataCategories = [
    {
      id: 'systems',
      name: 'Systems',
      icon: Database,
      color: 'from-blue-500 to-blue-600',
      count: systems.length
    },
    {
      id: 'vendors',
      name: 'Vendors',
      icon: Users,
      color: 'from-green-500 to-green-600',
      count: vendors.length
    },
    {
      id: 'construction-supervisors',
      name: 'Construction Supervisors',
      icon: HardHat,
      color: 'from-purple-500 to-purple-600',
      count: supervisors.length
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Data Management</h2>
          <Button variant="outline" onClick={loadData}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {dataCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`cursor-pointer overflow-hidden transition-all hover:shadow-lg ${
                  dataType === category.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setDataType(category.id as DataType)}
              >
                <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                  <category.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{category.count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {category.count === 1 ? 'Entry' : 'Entries'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </Card>
    </div>
  )
} 