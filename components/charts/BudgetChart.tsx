"use client"

import { FinancialMetrics } from "@/utils/supabase/dashboard-queries"

interface BudgetChartProps {
  data?: FinancialMetrics
}

export function BudgetChart({ data }: BudgetChartProps = {}) {
  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      Budget Chart
      {data && (
        <div>
          Total Budget: ${data.totalBudget?.toLocaleString()}
        </div>
      )}
    </div>
  )
} 