import { createClient } from './client'

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
  status: string
  land_cost: number
  dig_cost: number
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
}

export interface GWDMetrics {
  totalCount: number
  statusCounts: {
    Complete: number
    'In Progress': number
    Cancelled: number
    'On Hold': number
    'Not Started': number
    'Waiting for CLEIR': number
    Ready: number
    'No Longer Mine': number
  }
}

export interface CriticalAlert {
  title: string
  description: string
  priority: 'default' | 'destructive' | 'warning'
  link: string
  action: string
}

export type CriticalAlerts = CriticalAlert[]

// Query functions
export async function getFinancialMetrics(): Promise<FinancialMetrics> {
  const supabase = createClient()
  
  // Get AFE totals
  const { data: afes } = await supabase
    .from('afes')
    .select('budget, current_costs')

  // Get PO counts
  const { data: pos } = await supabase
    .from('purchase_orders')
    .select('status')

  const totalBudget = afes?.reduce((sum, afe) => sum + (afe.budget || 0), 0) || 0
  const totalSpent = afes?.reduce((sum, afe) => sum + (afe.current_costs || 0), 0) || 0
  
  return {
    totalBudget,
    totalSpent,
    remainingBudget: totalBudget - totalSpent,
    poCount: pos?.length || 0,
    openPOs: pos?.filter(po => po.status === 'Open').length || 0,
    closedPOs: pos?.filter(po => po.status === 'Closed').length || 0
  }
}

export async function getGWDMetrics(): Promise<GWDMetrics> {
  const supabase = createClient()
  
  const { data: gwds } = await supabase
    .from('gwds')
    .select('status')

  const statusCounts = {
    Complete: 0,
    'In Progress': 0,
    Cancelled: 0,
    'On Hold': 0,
    'Not Started': 0,
    'Waiting for CLEIR': 0,
    Ready: 0,
    'No Longer Mine': 0
  }

  gwds?.forEach(gwd => {
    statusCounts[gwd.status as keyof typeof statusCounts]++
  })

  return {
    totalCount: gwds?.length || 0,
    statusCounts
  }
}

export async function getCriticalAlerts(): Promise<CriticalAlerts> {
  const supabase = createClient()
  const alerts: CriticalAlerts = []

  // Check for AFEs near budget
  const { data: afes } = await supabase
    .from('afes')
    .select('afe_number, budget, current_costs')
    .filter('status', 'eq', 'Active')

  afes?.forEach(afe => {
    if (afe.current_costs / afe.budget > 0.9) {
      alerts.push({
        title: `AFE ${afe.afe_number} Near Budget Limit`,
        description: `Current spend is at ${Math.round((afe.current_costs / afe.budget) * 100)}% of budget`,
        priority: 'warning',
        link: `/protected/afes/${afe.afe_number}`,
        action: 'View AFE'
      })
    }
  })

  return alerts
} 