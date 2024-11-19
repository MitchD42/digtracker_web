import { createClient } from './client'
import { GWD_STATUS_COLORS } from '@/lib/constants/chart-colors'

// Create a type from the keys of GWD_STATUS_COLORS
type GWDStatus = keyof typeof GWD_STATUS_COLORS

// Define base types
interface AFE {
  afe_id: number
  afe_number: string
  budget: number
  status: string
  purchase_orders: PurchaseOrder[]
  gwds: GWD[]
}

interface PurchaseOrder {
  initial_value: number
  change_orders: ChangeOrder[]
  po_number: string
  status: 'Open' | 'Closed'
}

interface ChangeOrder {
  value: number
}

interface GWD {
  gwd_id: number
  status: GWDStatus
  land_cost: number
  dig_cost: number
  execution_year?: number
  inspection_completion_date?: string
  afe: {
    afe_number: string
    system: {
      system_name: string
    }
  }
}

// Export interfaces for metrics
export interface FinancialMetrics {
  totalBudget: number
  totalSpent: number
  remainingBudget: number
  poCount: number
  openPOs: number
  closedPOs: number
  afeBreakdown: {
    afeNumber: string
    budget: number
    spent: number
    remaining: number
  }[]
}

export interface GWDMetrics {
  totalCount: number
  statusCounts: Record<keyof typeof GWD_STATUS_COLORS, number>
}

export interface CriticalAlert {
  title: string
  description: string
  priority: 'default' | 'destructive' | 'warning'
  link: string
  action: string
}

export type CriticalAlerts = CriticalAlert[]

// Add these interfaces at the top with the other interfaces
interface CSAssignment {
  cs_gwd_id: number
  work_end: string
  gwd: {
    gwd_number: string
  }
  cs: {
    name: string
  }
}

// Query functions
export async function getFinancialMetrics(): Promise<FinancialMetrics> {
  const supabase = createClient()
  
  // Get AFEs with their GWDs
  const { data: afes } = await supabase
    .from('afes')
    .select(`
      afe_id,
      afe_number,
      budget,
      gwds (
        land_cost,
        dig_cost
      )
    `)
    .order('afe_number')

  // Get PO counts
  const { data: pos } = await supabase
    .from('purchase_orders')
    .select('status')

  const afeBreakdown = afes?.map(afe => {
    // Calculate total spent from GWD costs
    const spent = afe.gwds?.reduce((sum, gwd) => 
      sum + (gwd.land_cost || 0) + (gwd.dig_cost || 0), 0) || 0

    return {
      afeNumber: afe.afe_number,
      budget: afe.budget || 0,
      spent: spent,
      remaining: (afe.budget || 0) - spent
    }
  }) || []

  const totalBudget = afeBreakdown.reduce((sum, afe) => sum + afe.budget, 0)
  const totalSpent = afeBreakdown.reduce((sum, afe) => sum + afe.spent, 0)
  
  return {
    totalBudget,
    totalSpent,
    remainingBudget: totalBudget - totalSpent,
    poCount: pos?.length || 0,
    openPOs: pos?.filter(po => po.status === 'Open').length || 0,
    closedPOs: pos?.filter(po => po.status === 'Closed').length || 0,
    afeBreakdown
  }
}

export async function getGWDMetrics(): Promise<GWDMetrics> {
  const supabase = createClient()
  
  const { data: gwds, error } = await supabase
    .from('gwds')
    .select('status')

  if (error) {
    console.error('Error fetching GWD metrics:', error)
    return {
      totalCount: 0,
      statusCounts: Object.keys(GWD_STATUS_COLORS).reduce((acc, status) => {
        acc[status as keyof typeof GWD_STATUS_COLORS] = 0
        return acc
      }, {} as Record<keyof typeof GWD_STATUS_COLORS, number>)
    }
  }

  const statusCounts = Object.keys(GWD_STATUS_COLORS).reduce((acc, status) => {
    acc[status as keyof typeof GWD_STATUS_COLORS] = 0
    return acc
  }, {} as Record<keyof typeof GWD_STATUS_COLORS, number>)

  gwds?.forEach(gwd => {
    const status = gwd.status as keyof typeof GWD_STATUS_COLORS
    if (status && status in GWD_STATUS_COLORS) {
      statusCounts[status]++
    } else {
      console.warn('Unknown status:', gwd.status)
    }
  })

  return {
    totalCount: gwds?.length || 0,
    statusCounts
  }
}

export async function getCriticalAlerts(): Promise<CriticalAlerts> {
  const supabase = createClient()
  const alerts: CriticalAlerts = []

  // Get AFEs with their GWDs for budget alerts
  const { data: afes } = await supabase
    .from('afes')
    .select(`
      afe_id,
      afe_number,
      budget,
      status,
      gwds (
        gwd_id,
        status,
        land_cost,
        dig_cost
      )
    `)
    .filter('status', 'eq', 'Active')

  // Budget alerts
  afes?.forEach(afe => {
    const spent = afe.gwds?.reduce((sum, gwd) => 
      sum + (gwd.land_cost || 0) + (gwd.dig_cost || 0), 0) || 0
    
    const spentPercentage = (spent / afe.budget) * 100

    if (spentPercentage > 90) {
      alerts.push({
        title: `AFE ${afe.afe_number} Near Budget Limit`,
        description: `Current spend is at ${Math.round(spentPercentage)}% of budget`,
        priority: 'warning',
        link: `/protected/afes/${afe.afe_number}`,
        action: 'View AFE'
      })
    }

    if (spentPercentage > 100) {
      alerts.push({
        title: `AFE ${afe.afe_number} Over Budget`,
        description: `Current spend is at ${Math.round(spentPercentage)}% of budget`,
        priority: 'destructive',
        link: `/protected/afes/${afe.afe_number}`,
        action: 'View AFE'
      })
    }
  })

  // GWD status alerts
  const { data: staleGWDs } = await supabase
    .from('gwds')
    .select(`
      gwd_id,
      gwd_number,
      status,
      afe:afes (afe_number)
    `)
    .in('status', ['Site Selected', 'Dig Postponed'])
    .lt('created_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  staleGWDs?.forEach(gwd => {
    alerts.push({
      title: `Stale GWD ${gwd.gwd_number}`,
      description: `GWD has been in ${gwd.status} status for over 30 days`,
      priority: 'warning',
      link: `/protected/gwds/${gwd.gwd_id}`,
      action: 'View GWD'
    })
  })

  // CS end date alerts
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  
  const { data: csAssignments } = await supabase
    .from('cs_gwds')
    .select(`
      cs_gwd_id,
      work_end,
      gwd:gwds (
        gwd_number
      ),
      cs:construction_supervisors (
        name
      )
    `)
    .lte('work_end', oneMonthFromNow.toISOString())
    .gte('work_end', new Date().toISOString()) as { data: CSAssignment[] | null }

  csAssignments?.forEach((assignment: CSAssignment) => {
    const daysUntilEnd = Math.ceil((new Date(assignment.work_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    alerts.push({
      title: `CS Assignment Ending Soon`,
      description: `${assignment.cs.name}'s assignment to GWD ${assignment.gwd.gwd_number} ends in ${daysUntilEnd} days`,
      priority: 'default',
      link: `/protected/gwds/${assignment.gwd.gwd_number}`,
      action: 'View GWD'
    })
  })

  return alerts
} 