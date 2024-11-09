'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clipboard, ShoppingCart, BarChart2, Activity, Package } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { AFE, GWDWithAFE, PurchaseOrder, Material } from '@/types/database'
import { 
  getFinancialMetrics, 
  getGWDMetrics, 
  getCriticalAlerts,
  type FinancialMetrics,
  type GWDMetrics,
  type CriticalAlerts
} from '@/utils/supabase/dashboard-queries'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GWDStatusChart } from "@/components/charts/GWDStatusChart"
import { BudgetChart } from "@/components/charts/BudgetChart"
import { LucideIcon } from 'lucide-react'

interface POData extends PurchaseOrder {
  change_orders: Array<{
    value: number
  }>
  initial_value: number
  po_number: string
  status: 'Open' | 'Closed'
  created_date: string
}

interface FinancialMetric {
  name: string
  value: number
  indicator: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
}

export default function Dashboard() {
  const supabase = createClient()
  const [metrics, setMetrics] = useState<{
    financial: FinancialMetrics | null
    gwdStatus: GWDMetrics | null
    alerts: CriticalAlerts | null
  }>({
    financial: null,
    gwdStatus: null,
    alerts: null
  })

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [financial, gwdStatus, alerts] = await Promise.all([
          getFinancialMetrics(),
          getGWDMetrics(),
          getCriticalAlerts()
        ])

        setMetrics({
          financial,
          gwdStatus,
          alerts
        })
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      }
    }

    loadDashboardData()
  }, [])

  const items = [
    { 
      name: 'AFEs', 
      icon: FileText, 
      count: metrics.financial?.totalBudget || 0,
      subtext: `$${metrics.financial?.totalBudget.toLocaleString()} total budget`,
      color: 'from-blue-500 to-blue-600' 
    },
    { 
      name: 'GWDs', 
      icon: Clipboard, 
      count: metrics.gwdStatus?.totalCount || 0,
      subtext: `${metrics.gwdStatus?.statusCounts?.['Complete'] || 0} completed, ${metrics.gwdStatus?.statusCounts?.['In Progress'] || 0} in progress`,
      color: 'from-green-500 to-green-600' 
    },
    { 
      name: 'POs', 
      icon: ShoppingCart, 
      count: metrics.financial?.poCount || 0,
      subtext: `${metrics.financial?.openPOs || 0} open, ${metrics.financial?.closedPOs || 0} closed`,
      color: 'from-purple-500 to-purple-600' 
    },
  ]

  const getIndicatorColor = (indicator: string) => {
    switch (indicator) {
      case 'positive':
        return 'from-green-500 to-green-600'
      case 'negative':
        return 'from-red-500 to-red-600'
      default:
        return 'from-blue-500 to-blue-600'
    }
  }

  const financialMetrics: FinancialMetric[] = [
    {
      name: 'Total Budget',
      value: metrics.financial?.totalBudget || 0,
      indicator: 'positive',
      icon: BarChart2
    },
    {
      name: 'Total Spent',
      value: metrics.financial?.totalSpent || 0,
      indicator: metrics.financial?.totalSpent && metrics.financial?.totalBudget 
        ? (metrics.financial.totalSpent / metrics.financial.totalBudget > 0.9 ? 'negative' : 'neutral')
        : 'neutral',
      icon: Activity
    },
    {
      name: 'Remaining Budget',
      value: metrics.financial?.remainingBudget || 0,
      indicator: metrics.financial?.remainingBudget && metrics.financial?.totalBudget
        ? (metrics.financial.remainingBudget / metrics.financial.totalBudget < 0.1 ? 'negative' : 'positive')
        : 'positive',
      icon: BarChart2
    }
  ]

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
      </div>
      
      {/* Financial Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {financialMetrics.map((metric) => (
          <Card key={metric.name} className="overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${getIndicatorColor(metric.indicator)}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metric.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Status */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>GWD Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <GWDStatusChart /> {/* Pie or bar chart showing GWD statuses */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetChart /> {/* Bar chart showing budget vs actual by AFE */}
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Attention Required</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.alerts?.map((alert) => (
              <Alert key={alert.title} variant={alert.priority}>
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>
                  {alert.description}
                  <Button variant="link" asChild>
                    <Link href={alert.link}>{alert.action}</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}