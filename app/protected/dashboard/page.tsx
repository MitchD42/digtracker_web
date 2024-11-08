'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clipboard, ShoppingCart, BarChart2, Activity, Package } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { AFE, GWDWithAFE, PurchaseOrder, Material } from '@/types/database'

interface POData extends PurchaseOrder {
  change_orders: Array<{
    value: number
  }>
  initial_value: number
  po_number: string
  status: 'Open' | 'Closed'
  created_date: string
}

export default function Dashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    afeCount: 0,
    gwdCount: 0,
    poCount: 0,
    totalBudget: 0,
    totalGWDCosts: 0,
    totalPOCosts: 0,
    completedGWDs: 0,
    inProgressGWDs: 0,
    totalMaterials: 0,
    totalMaterialCosts: 0,
    openPOs: 0,
    closedPOs: 0
  })
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: string;
    description: string;
    date: string;
  }>>([])

  useEffect(() => {
    async function fetchData() {
      // Fetch AFEs
      const { data: afes } = await supabase
        .from('afes')
        .select('*')
      
      // Fetch GWDs with AFE details
      const { data: gwds } = await supabase
        .from('gwds')
        .select('*, afe:afes(*)')
      
      console.log('GWD Data Structure:', {
        firstGWD: gwds?.[0],
        gwdKeys: gwds?.[0] ? Object.keys(gwds[0]) : [],
        fullData: gwds
      });

      // Fetch POs with change orders
      const { data: pos } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          change_orders(*)
        `)

      // Add materials fetch
      const { data: materials } = await supabase.from('materials').select('*')

      if (afes && gwds && pos && materials) {
        const totalPOValue = pos.reduce((sum: number, po: POData) => {
          const changeOrderTotal = po.change_orders.reduce((coSum: number, co: { value: number }) => 
            coSum + (co.value || 0), 0
          )
          return sum + (po.initial_value || 0) + changeOrderTotal
        }, 0)

        // Calculate material stats
        const totalMaterialCosts = materials.reduce((sum: number, material: Material) => 
          sum + (material.price || 0), 0
        )

        setStats({
          afeCount: afes.length,
          gwdCount: gwds.length,
          poCount: pos.length,
          totalBudget: afes.reduce((sum: number, afe: AFE) => sum + (afe.budget || 0), 0),
          totalGWDCosts: gwds.reduce((sum: number, gwd: GWDWithAFE) => 
            sum + (gwd.land_cost || 0) + (gwd.dig_cost || 0), 0
          ),
          totalPOCosts: totalPOValue,
          completedGWDs: gwds.filter((gwd: GWDWithAFE) => gwd.status === 'Complete').length,
          inProgressGWDs: gwds.filter((gwd: GWDWithAFE) => gwd.status === 'In Progress').length,
          totalMaterials: materials.length,
          totalMaterialCosts,
          openPOs: pos.filter((po: POData) => po.status === 'Open').length,
          closedPOs: pos.filter((po: POData) => po.status === 'Closed').length
        })

        // Get recent GWDs
        const recentGWDs = gwds
          .sort((a: GWDWithAFE, b: GWDWithAFE) => 
            new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
          )
          .slice(0, 5)
          .map((gwd: GWDWithAFE) => ({
            type: 'GWD',
            description: `GWD ${gwd.gwd_number} - ${gwd.status}`,
            date: new Date(gwd.created_date).toLocaleDateString()
          }))

        // Get recent POs
        const recentPOs = pos
          .sort((a: POData, b: POData) => 
            new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
          )
          .slice(0, 5)
          .map((po: POData) => ({
            type: 'PO',
            description: `PO ${po.po_number} - $${po.initial_value.toLocaleString()}`,
            date: new Date(po.created_date).toLocaleDateString()
          }))

        // Get recent materials
        const recentMaterials = materials
          .sort((a: Material, b: Material) => 
            new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
          )
          .slice(0, 5)
          .map((material: Material) => ({
            type: 'Material',
            description: `Material added: $${material.price.toLocaleString()}`,
            date: new Date(material.created_date).toLocaleDateString()
          }))

        // Combine all activity
        const allActivity = [
          ...recentGWDs, 
          ...recentPOs, 
          ...recentMaterials
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
         .slice(0, 5)

        setRecentActivity(allActivity)
      }
    }

    fetchData()
  }, [])

  const items = [
    { 
      name: 'AFEs', 
      icon: FileText, 
      count: stats.afeCount,
      subtext: `$${stats.totalBudget.toLocaleString()} total budget`,
      color: 'from-blue-500 to-blue-600' 
    },
    { 
      name: 'GWDs', 
      icon: Clipboard, 
      count: stats.gwdCount,
      subtext: `${stats.completedGWDs} completed, ${stats.inProgressGWDs} in progress`,
      color: 'from-green-500 to-green-600' 
    },
    { 
      name: 'Materials', 
      icon: Package, 
      count: stats.totalMaterials,
      subtext: `$${stats.totalMaterialCosts.toLocaleString()} total value`,
      color: 'from-orange-500 to-orange-600' 
    },
    { 
      name: 'POs', 
      icon: ShoppingCart, 
      count: stats.poCount,
      subtext: `${stats.openPOs} open, ${stats.closedPOs} closed`,
      color: 'from-purple-500 to-purple-600' 
    },
  ]

  return (
    <div className="container mx-auto py-10 px-4">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Overview</h2>
      
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${item.color}`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{item.count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.subtext}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}