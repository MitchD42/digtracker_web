import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GWDWithAFE } from '@/types/database'
import { UI } from '@/lib/constants/ui'
import { CostOverview } from '../visualizations/CostOverview'

interface CostReportProps {
  data: {
    gwds: GWDWithAFE[] | null
    costs: any[] | null
  }
}

export function CostReport({ data }: CostReportProps) {
  if (!data.gwds || !data.costs) return null

  const totalBudget = data.gwds.reduce((sum, gwd) => sum + (gwd.initial_budget || 0), 0)
  const totalCost = data.gwds.reduce((sum, gwd) => sum + (gwd.land_cost || 0) + (gwd.dig_cost || 0), 0)

  return (
    <div className="space-y-6">
      <CostOverview 
        totalBudget={totalBudget}
        totalCost={totalCost}
        data={data.costs}
      />
    </div>
  )
} 