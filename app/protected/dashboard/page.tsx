'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clipboard, ShoppingCart, BarChart2, Activity } from 'lucide-react'
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
import { UI } from '@/lib/constants/ui'

interface FinancialMetric {
  name: string
  value: number
  indicator: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<{
    financial: FinancialMetrics | undefined
    gwdStatus: GWDMetrics | undefined
    alerts: CriticalAlerts | undefined
  }>({
    financial: undefined,
    gwdStatus: undefined,
    alerts: undefined
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
      subtext: `${metrics.gwdStatus?.statusCounts?.['Dig Completed'] || 0} completed, ${
        (metrics.gwdStatus?.statusCounts?.['Site Selected'] || 0) +
        (metrics.gwdStatus?.statusCounts?.['With CLEIR'] || 0) +
        (metrics.gwdStatus?.statusCounts?.['CLEIR Approved'] || 0)
      } in progress`,
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
    <div className={UI.containers.section + " container mx-auto py-10 px-4"}>
      <div className="flex justify-between items-center mb-8">
        <h2 className={UI.text.title + " text-3xl"}>Dashboard</h2>
      </div>
      
      {/* Financial Overview */}
      <div className={UI.containers.statsGrid}>
        {financialMetrics.map((metric) => (
          <Card key={metric.name} className="overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${getIndicatorColor(metric.indicator)}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={UI.statsCard.label}>{metric.name}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={UI.statsCard.value}>
                ${metric.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Status */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card className={UI.statsCard.container}>
          <CardHeader>
            <CardTitle>GWD Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <GWDStatusChart data={metrics.gwdStatus} />
          </CardContent>
        </Card>

        <Card className={UI.statsCard.container}>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetChart data={metrics.financial} />
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      <Card className={UI.containers.card}>
        <CardHeader>
          <CardTitle>Attention Required</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.alerts?.map((alert) => (
              <Alert key={alert.title} variant={alert.priority}>
                <AlertTitle className={UI.text.title}>{alert.title}</AlertTitle>
                <AlertDescription className={UI.text.subtitle}>
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